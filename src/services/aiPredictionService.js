import openai from "../config/openaiConfig.js";
import AIPrediction from "../models/aiPrediction.js";
import CenterInventory from "../models/centerInventory.js";
import Part from "../models/part.js";
import ServiceRecord from "../models/serviceRecord.js";
import InventoryTransaction from "../models/inventoryTransaction.js";
import Vehicle from "../models/vehicle.js";
import VehicleModel from "../models/vehicleModel.js";
import moment from "moment-timezone";

class AIPredictionService {
  /**
   * Tạo dự đoán AI cho inventory optimization
   */
  async generateInventoryPrediction(centerId, userId) {
    try {
      // 1. Thu thập dữ liệu lịch sử
      const analysisData = await this.collectAnalysisData(centerId);

      // 2. Gọi AI để phân tích và đưa ra dự đoán
      const aiPredictions = await this.callAIForPrediction(
        analysisData,
        centerId
      );

      // 3. Lưu kết quả vào database
      const prediction = new AIPrediction({
        centerId,
        predictionType: "inventory_optimization",
        analysisData,
        predictions: aiPredictions,
        validUntil: moment().add(30, "days").toDate(), // Có hiệu lực 30 ngày
        status: "active",
      });

      await prediction.save();

      return {
        success: true,
        data: prediction,
        message: "AI prediction generated successfully",
      };
    } catch (error) {
      console.error("Error generating AI prediction:", error);
      throw new Error(`Failed to generate AI prediction: ${error.message}`);
    }
  }

  /**
   * Thu thập dữ liệu phân tích từ database
   */
  async collectAnalysisData(centerId) {
    try {
      // Lấy dữ liệu inventory hiện tại
      const currentInventory = await CenterInventory.find({ centerId })
        .populate("partId")
        .lean();

      // Lấy dữ liệu sử dụng phụ tùng trong 12 tháng qua
      const twelveMonthsAgo = moment().subtract(12, "months").toDate();
      const serviceRecords = await ServiceRecord.find({
        serviceDate: { $gte: twelveMonthsAgo },
      }).lean();

      // Lấy dữ liệu giao dịch inventory
      const inventoryTransactions = await InventoryTransaction.find({
        transactionDate: { $gte: twelveMonthsAgo },
        transactionType: "out",
      })
        .populate({
          path: "inventoryId",
          match: { centerId },
          populate: { path: "partId" },
        })
        .lean();

      // Lấy thông tin xe trong hệ thống
      const vehicles = await Vehicle.find()
        .populate("vehicleInfo.vehicleModel")
        .lean();

      // Phân tích dữ liệu sử dụng phụ tùng
      const historicalUsage = await this.analyzePartUsage(
        serviceRecords,
        inventoryTransactions,
        currentInventory
      );

      // Phân tích phân bố xe
      const vehiclePopulation = this.analyzeVehiclePopulation(vehicles);

      // Phân tích pattern dịch vụ
      const servicePatterns = this.analyzeServicePatterns(serviceRecords);

      return {
        historicalUsage,
        seasonalFactors: this.calculateSeasonalFactors(serviceRecords),
        vehiclePopulation,
        servicePatterns,
        currentInventoryStatus: currentInventory.map((item) => ({
          partId: item.partId._id,
          partName: item.partId.partName,
          currentStock: item.currentStock,
          minStockLevel: item.minStockLevel,
          maxStockLevel: item.maxStockLevel,
          reorderPoint: item.reorderPoint,
          category: item.partId.category,
          isCritical: item.partId.isCritical,
        })),
      };
    } catch (error) {
      console.error("Error collecting analysis data:", error);
      throw error;
    }
  }

  /**
   * Phân tích sử dụng phụ tùng theo thời gian
   */
  async analyzePartUsage(
    serviceRecords,
    inventoryTransactions,
    currentInventory
  ) {
    const partUsageMap = new Map();

    // Phân tích từ service records
    serviceRecords.forEach((record) => {
      if (record.partsUsed && record.partsUsed.length > 0) {
        record.partsUsed.forEach((part) => {
          const month = moment(record.serviceDate).month();
          if (!partUsageMap.has(part.partName)) {
            partUsageMap.set(part.partName, {
              partName: part.partName,
              monthlyUsage: new Array(12).fill(0),
              totalUsage: 0,
            });
          }
          const usage = partUsageMap.get(part.partName);
          usage.monthlyUsage[month] += part.quantity || 1;
          usage.totalUsage += part.quantity || 1;
        });
      }
    });

    // Phân tích từ inventory transactions
    inventoryTransactions.forEach((transaction) => {
      if (transaction.inventoryId && transaction.inventoryId.partId) {
        const partName = transaction.inventoryId.partId.partName;
        const month = moment(transaction.transactionDate).month();

        if (!partUsageMap.has(partName)) {
          partUsageMap.set(partName, {
            partName,
            monthlyUsage: new Array(12).fill(0),
            totalUsage: 0,
          });
        }
        const usage = partUsageMap.get(partName);
        usage.monthlyUsage[month] += transaction.quantity;
        usage.totalUsage += transaction.quantity;
      }
    });

    // Tính toán trend và average
    return Array.from(partUsageMap.values()).map((usage) => {
      const averageUsage = usage.totalUsage / 12;
      const trend = this.calculateTrend(usage.monthlyUsage);

      return {
        partName: usage.partName,
        monthlyUsage: usage.monthlyUsage,
        averageUsage,
        trend,
        totalUsage: usage.totalUsage,
      };
    });
  }

  /**
   * Tính toán xu hướng sử dụng
   */
  calculateTrend(monthlyData) {
    if (monthlyData.length < 6) return "stable";

    const firstHalf = monthlyData.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const secondHalf = monthlyData.slice(6).reduce((a, b) => a + b, 0) / 6;

    const changePercent = ((secondHalf - firstHalf) / (firstHalf || 1)) * 100;

    if (changePercent > 15) return "increasing";
    if (changePercent < -15) return "decreasing";
    return "stable";
  }

  /**
   * Phân tích phân bố xe
   */
  analyzeVehiclePopulation(vehicles) {
    const modelCount = new Map();
    let totalVehicles = vehicles.length;

    vehicles.forEach((vehicle) => {
      if (vehicle.vehicleInfo?.vehicleModel) {
        const modelId = vehicle.vehicleInfo.vehicleModel._id.toString();
        if (!modelCount.has(modelId)) {
          modelCount.set(modelId, {
            modelId,
            modelName: vehicle.vehicleInfo.vehicleModel.modelName,
            count: 0,
            totalAge: 0,
          });
        }
        const model = modelCount.get(modelId);
        model.count++;

        // Tính tuổi xe (giả sử có trường year)
        if (vehicle.vehicleInfo.year) {
          model.totalAge += new Date().getFullYear() - vehicle.vehicleInfo.year;
        }
      }
    });

    const modelDistribution = Array.from(modelCount.values()).map((model) => ({
      modelId: model.modelId,
      modelName: model.modelName,
      count: model.count,
      averageAge: model.count > 0 ? model.totalAge / model.count : 0,
    }));

    return {
      totalVehicles,
      modelDistribution,
    };
  }

  /**
   * Phân tích pattern dịch vụ
   */
  analyzeServicePatterns(serviceRecords) {
    const monthlyServices = new Array(12).fill(0);

    serviceRecords.forEach((record) => {
      const month = moment(record.serviceDate).month();
      monthlyServices[month]++;
    });

    const averageServiceInterval =
      this.calculateAverageServiceInterval(serviceRecords);
    const peakServiceMonths = this.findPeakMonths(monthlyServices);

    return {
      averageServiceInterval,
      peakServiceMonths,
      monthlyServiceCounts: monthlyServices,
    };
  }

  /**
   * Tính hệ số mùa vụ
   */
  calculateSeasonalFactors(serviceRecords) {
    const monthlyCount = new Array(12).fill(0);

    serviceRecords.forEach((record) => {
      const month = moment(record.serviceDate).month();
      monthlyCount[month]++;
    });

    const average = monthlyCount.reduce((a, b) => a + b, 0) / 12;
    const seasonalFactors = new Map();

    monthlyCount.forEach((count, month) => {
      seasonalFactors.set(
        (month + 1).toString(),
        average > 0 ? count / average : 1
      );
    });

    return seasonalFactors;
  }

  /**
   * Tìm tháng cao điểm
   */
  findPeakMonths(monthlyData) {
    const average = monthlyData.reduce((a, b) => a + b, 0) / 12;
    return monthlyData
      .map((count, index) => ({ month: index + 1, count }))
      .filter((item) => item.count > average * 1.2)
      .map((item) => item.month);
  }

  /**
   * Tính khoảng cách trung bình giữa các lần bảo dưỡng
   */
  calculateAverageServiceInterval(serviceRecords) {
    // Nhóm theo vehicleId và tính khoảng cách
    const vehicleServices = new Map();

    serviceRecords.forEach((record) => {
      const vehicleId = record.vehicleId.toString();
      if (!vehicleServices.has(vehicleId)) {
        vehicleServices.set(vehicleId, []);
      }
      vehicleServices.get(vehicleId).push(record.serviceDate);
    });

    let totalIntervals = 0;
    let intervalCount = 0;

    vehicleServices.forEach((dates) => {
      if (dates.length > 1) {
        dates.sort((a, b) => new Date(a) - new Date(b));
        for (let i = 1; i < dates.length; i++) {
          const interval = moment(dates[i]).diff(moment(dates[i - 1]), "days");
          totalIntervals += interval;
          intervalCount++;
        }
      }
    });

    return intervalCount > 0 ? Math.round(totalIntervals / intervalCount) : 90; // Default 90 days
  }

  /**
   * Gọi AI để phân tích và đưa ra dự đoán
   */
  async callAIForPrediction(analysisData, centerId) {
    try {
      const prompt = this.buildAIPrompt(analysisData);

      const completion = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "system",
            content: `Bạn là một chuyên gia phân tích inventory và dự đoán nhu cầu phụ tùng cho trung tâm bảo dưỡng xe điện. 
            Hãy phân tích dữ liệu được cung cấp và đưa ra các khuyến nghị cụ thể về:
            1. Mức tồn kho tối thiểu và tối đa cho từng phụ tùng
            2. Dự đoán nhu cầu trong 30, 60, 90 ngày tới
            3. Đánh giá mức độ rủi ro thiếu hàng
            4. Khuyến nghị tối ưu hóa chi phí
            
            Trả về kết quả dưới dạng JSON với cấu trúc được chỉ định.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const aiResponse = completion.choices[0].message.content;

      // Parse JSON response từ AI
      let parsedResponse;
      try {
        // Tìm và extract JSON từ response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in AI response");
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        // Fallback: tạo response mặc định dựa trên dữ liệu
        parsedResponse = this.generateFallbackPrediction(analysisData);
      }

      return this.processPredictionResponse(parsedResponse, analysisData);
    } catch (error) {
      console.error("Error calling AI for prediction:", error);
      // Fallback: tạo prediction dựa trên logic đơn giản
      return this.generateFallbackPrediction(analysisData);
    }
  }

  /**
   * Xây dựng prompt cho AI
   */
  buildAIPrompt(analysisData) {
    return `
Phân tích dữ liệu inventory và đưa ra khuyến nghị tối ưu hóa tồn kho:

## Dữ liệu hiện tại:
### Tình trạng tồn kho:
${JSON.stringify(analysisData.currentInventoryStatus, null, 2)}

### Lịch sử sử dụng phụ tùng (12 tháng):
${JSON.stringify(analysisData.historicalUsage, null, 2)}

### Hệ số mùa vụ:
${JSON.stringify(Object.fromEntries(analysisData.seasonalFactors), null, 2)}

### Thông tin xe:
- Tổng số xe: ${analysisData.vehiclePopulation.totalVehicles}
- Phân bố theo model: ${JSON.stringify(
      analysisData.vehiclePopulation.modelDistribution,
      null,
      2
    )}

### Pattern dịch vụ:
- Khoảng cách trung bình giữa các lần bảo dưỡng: ${
      analysisData.servicePatterns.averageServiceInterval
    } ngày
- Tháng cao điểm: ${analysisData.servicePatterns.peakServiceMonths.join(", ")}

## Yêu cầu phân tích:
Hãy đưa ra khuyến nghị cho từng phụ tùng với format JSON sau:

QUAN TRỌNG: Tất cả các giá trị số phải là NUMBER, không được là string!

{
  "inventoryRecommendations": [
    {
      "partName": "tên phụ tùng",
      "currentStock": 10,
      "recommendedMinStock": 5,
      "recommendedMaxStock": 25,
      "predictedDemand": {
        "next30Days": 3,
        "next60Days": 6,
        "next90Days": 9
      },
      "riskLevel": "low",
      "reasoning": "lý_do_chi_tiết",
      "confidence": 0.8
    }
  ],
  "costOptimization": {
    "totalInventoryValue": 50000,
    "potentialSavings": 5000,
    "overStockedItems": ["tên_phụ_tùng_1", "tên_phụ_tùng_2"],
    "underStockedItems": ["tên_phụ_tùng_3"]
  }
}

LƯU Ý QUAN TRỌNG:
- Tất cả currentStock, recommendedMinStock, recommendedMaxStock, next30Days, next60Days, next90Days, totalInventoryValue, potentialSavings phải là số nguyên hoặc số thập phân, KHÔNG ĐƯỢC là chuỗi văn bản
- Nếu không có đủ thông tin để tính toán chính xác, hãy ước tính một giá trị số hợp lý thay vì trả về text
- Ví dụ: thay vì "Cần thông tin giá trị của từng phụ tùng để tính toán", hãy trả về 0 hoặc một ước tính như 10000

Lưu ý:
- Xem xét xu hướng sử dụng (tăng/giảm/ổn định)
- Tính đến hệ số mùa vụ
- Ưu tiên phụ tùng quan trọng (isCritical: true)
- Cân nhắc lead time của nhà cung cấp
- Tối ưu hóa chi phí lưu kho
`;
  }

  /**
   * Xử lý response từ AI
   */
  processPredictionResponse(aiResponse, analysisData) {
    try {
      // Validate và bổ sung thông tin từ analysisData
      const processedRecommendations =
        aiResponse.inventoryRecommendations?.map((rec) => {
          // Tìm thông tin chi tiết từ analysisData
          const currentItem = analysisData.currentInventoryStatus.find(
            (item) => item.partName === rec.partName
          );

          return {
            ...rec,
            partId: currentItem?.partId,
            category: currentItem?.category,
            isCritical: currentItem?.isCritical,
            confidence: rec.confidence || 0.7,
            // Đảm bảo các giá trị số được chuyển đổi đúng
            currentStock: this.parseToNumber(
              rec.currentStock,
              currentItem?.currentStock || 0
            ),
            recommendedMinStock: this.parseToNumber(rec.recommendedMinStock, 5),
            recommendedMaxStock: this.parseToNumber(
              rec.recommendedMaxStock,
              20
            ),
            predictedDemand: {
              next30Days: this.parseToNumber(
                rec.predictedDemand?.next30Days,
                2
              ),
              next60Days: this.parseToNumber(
                rec.predictedDemand?.next60Days,
                4
              ),
              next90Days: this.parseToNumber(
                rec.predictedDemand?.next90Days,
                6
              ),
            },
          };
        }) || [];

      // Xử lý costOptimization với fallback values
      const costOptimization = aiResponse.costOptimization || {};

      return {
        inventoryRecommendations: processedRecommendations,
        costOptimization: {
          totalInventoryValue: this.parseToNumber(
            costOptimization.totalInventoryValue,
            0
          ),
          potentialSavings: this.parseToNumber(
            costOptimization.potentialSavings,
            0
          ),
          overStockedItems: Array.isArray(costOptimization.overStockedItems)
            ? costOptimization.overStockedItems
            : [],
          underStockedItems: Array.isArray(costOptimization.underStockedItems)
            ? costOptimization.underStockedItems
            : [],
        },
      };
    } catch (error) {
      console.error("Error processing AI response:", error);
      return this.generateFallbackPrediction(analysisData);
    }
  }

  /**
   * Chuyển đổi giá trị thành số, với fallback value
   */
  parseToNumber(value, fallback = 0) {
    // Nếu đã là số
    if (typeof value === "number" && !isNaN(value)) {
      return value;
    }

    // Nếu là string, thử parse
    if (typeof value === "string") {
      // Loại bỏ các ký tự không phải số (trừ dấu chấm và dấu phẩy)
      const cleanValue = value.replace(/[^\d.,]/g, "");
      const parsed = parseFloat(cleanValue.replace(",", "."));

      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    // Trả về fallback nếu không parse được
    return fallback;
  }

  /**
   * Tạo prediction fallback khi AI không hoạt động
   */
  generateFallbackPrediction(analysisData) {
    const recommendations = analysisData.currentInventoryStatus.map((item) => {
      // Tìm dữ liệu sử dụng lịch sử
      const usage = analysisData.historicalUsage.find(
        (u) => u.partName === item.partName
      );
      const avgMonthlyUsage = usage ? usage.averageUsage : 2;

      // Tính toán dự đoán đơn giản
      const next30Days = Math.ceil(avgMonthlyUsage);
      const next60Days = Math.ceil(avgMonthlyUsage * 2);
      const next90Days = Math.ceil(avgMonthlyUsage * 3);

      // Khuyến nghị mức tồn kho
      const recommendedMinStock = Math.max(
        next30Days,
        item.isCritical ? 10 : 5
      );
      const recommendedMaxStock = next90Days + recommendedMinStock;

      // Đánh giá rủi ro
      let riskLevel = "low";
      if (item.currentStock < recommendedMinStock) {
        riskLevel = item.isCritical ? "critical" : "high";
      } else if (item.currentStock < next30Days) {
        riskLevel = "medium";
      }

      return {
        partId: item.partId,
        partName: item.partName,
        currentStock: item.currentStock,
        recommendedMinStock,
        recommendedMaxStock,
        predictedDemand: {
          next30Days,
          next60Days,
          next90Days,
        },
        riskLevel,
        reasoning: `Dựa trên mức sử dụng trung bình ${avgMonthlyUsage.toFixed(
          1
        )} cái/tháng và xu hướng ${usage?.trend || "stable"}`,
        confidence: 0.6,
      };
    });

    return {
      inventoryRecommendations: recommendations,
      costOptimization: {
        totalInventoryValue: 0,
        potentialSavings: 0,
        overStockedItems: recommendations
          .filter((r) => r.currentStock > r.recommendedMaxStock)
          .map((r) => r.partName),
        underStockedItems: recommendations
          .filter((r) => r.currentStock < r.recommendedMinStock)
          .map((r) => r.partName),
      },
    };
  }

  /**
   * Lấy prediction mới nhất cho center
   */
  async getLatestPrediction(centerId) {
    try {
      const prediction = await AIPrediction.findOne({
        centerId,
        predictionType: "inventory_optimization",
        status: "active",
        validUntil: { $gt: new Date() },
      })
        .populate("centerId")
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: prediction,
        message: prediction ? "Prediction found" : "No active prediction found",
      };
    } catch (error) {
      console.error("Error getting latest prediction:", error);
      throw new Error(`Failed to get prediction: ${error.message}`);
    }
  }

  /**
   * Cập nhật feedback cho prediction
   */
  async updatePredictionFeedback(predictionId, feedback, userId) {
    try {
      const prediction = await AIPrediction.findByIdAndUpdate(
        predictionId,
        {
          feedback: {
            ...feedback,
            updatedBy: userId,
          },
        },
        { new: true }
      );

      return {
        success: true,
        data: prediction,
        message: "Feedback updated successfully",
      };
    } catch (error) {
      console.error("Error updating feedback:", error);
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
  }

  /**
   * Lấy lịch sử predictions
   */
  async getPredictionHistory(centerId, limit = 10) {
    try {
      const predictions = await AIPrediction.find({ centerId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("centerId");

      return {
        success: true,
        data: predictions,
        message: "Prediction history retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting prediction history:", error);
      throw new Error(`Failed to get prediction history: ${error.message}`);
    }
  }
}

export default new AIPredictionService();
