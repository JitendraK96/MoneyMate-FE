import React, { useState } from "react";
import {
  Upload,
  FileImage,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";

interface Transaction {
  date: string;
  amount: number;
  payee: string;
}

interface AnalysisResult {
  transactions: Transaction[];
  totalAmount: number;
  transactionCount: number;
}

const TransactionAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setError("");
      setResult(null);
    } else {
      setError("Please select a valid image file (PNG, JPG, JPEG)");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError("");

    try {
      // Convert image to base64
      const base64Image = await convertToBase64(selectedFile);

      // Call Claude API to analyze the image
      const mockResponse = await analyzeWithClaude(base64Image);

      if (mockResponse.transactions) {
        const totalAmount = mockResponse.transactions.reduce(
          (sum: number, t: Transaction) => sum + t.amount,
          0
        );
        setResult({
          ...mockResponse,
          totalAmount,
          transactionCount: mockResponse.transactions.length,
        });
      } else {
        setError("No transactions found in the image");
      }
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Direct Claude API function with proxy
  const analyzeWithClaude = async (
    base64Image: string
  ): Promise<AnalysisResult> => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Claude API key not found. Please set REACT_APP_CLAUDE_API_KEY in your environment variables."
      );
    }

    const prompt = `
      Analyze this bank statement image and extract ONLY the debit transactions. 
      Ignore all credit transactions.
      
      Return the data in this exact JSON format:
      {
        "transactions": [
          {
            "date": "DD-MM-YYYY",
            "amount": number,
            "payee": "string"
          }
        ]
      }
      
      Rules:
      - Only include transactions with debit amounts
      - Date should be in DD-MM-YYYY format
      - Amount should be a number (without currency symbols)
      - Include the full payee/description text
      - Return only valid JSON, no additional text or explanations
    `;

    // Determine image type from base64 more accurately
    const getImageType = (base64: string): string => {
      // Check the data URL prefix first
      if (base64.startsWith("data:image/png")) return "image/png";
      if (base64.startsWith("data:image/gif")) return "image/gif";
      if (base64.startsWith("data:image/webp")) return "image/webp";
      if (
        base64.startsWith("data:image/jpeg") ||
        base64.startsWith("data:image/jpg")
      )
        return "image/jpeg";

      // If no data URL prefix, check the base64 content signature
      const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

      // JPEG signatures
      if (
        base64Data.startsWith("/9j/") ||
        base64Data.startsWith("iVBORw0KGgo")
      ) {
        return base64Data.startsWith("/9j/") ? "image/jpeg" : "image/png";
      }

      // PNG signature
      if (base64Data.startsWith("iVBORw0KGgo")) return "image/png";

      // GIF signature
      if (base64Data.startsWith("R0lGOD")) return "image/gif";

      // WebP signature
      if (base64Data.startsWith("UklGR")) return "image/webp";

      // Default to JPEG
      return "image/jpeg";
    };

    const imageType = getImageType(base64Image);
    const base64Data = base64Image.split(",")[1];

    try {
      const response = await fetch(import.meta.env.VITE_ANAYLZE_STATEMENT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, imageType, base64Data }),
      });

      const data = await response.json();
      const {
        data: { analyzedStatment },
      } = data;
      const content = analyzedStatment;

      let parsedData;
      try {
        const jsonMatch =
          content.match(/```json\s*([\s\S]*?)\s*```/) ||
          content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        parsedData = JSON.parse(jsonStr.trim());
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw content:", content);
        parsedData = JSON.parse(content);
      }

      return {
        transactions: parsedData.transactions || [],
        totalAmount: 0,
        transactionCount: 0,
      };
    } catch (error) {
      console.error("Claude API Error:", error);
      throw new Error(
        `Failed to analyze image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const downloadJSON = () => {
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "bank_transactions.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bank Statement Transaction Analyzer
        </h1>
        <p className="text-gray-600">
          Upload a bank statement image to extract debit transactions
          automatically
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : selectedFile
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="file-upload"
        />

        {selectedFile ? (
          <div className="space-y-4">
            <FileImage className="mx-auto h-16 w-16 text-green-500" />
            <div>
              <p className="text-lg font-medium text-green-700">
                File Selected
              </p>
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-16 w-16 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your bank statement image here
              </p>
              <p className="text-sm text-gray-500">or</p>
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Browse Files
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Supports PNG, JPG, JPEG formats
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Analyze Button */}
      {selectedFile && (
        <div className="mt-6 text-center">
          <button
            onClick={analyzeImage}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze Transactions</span>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Transactions:</span>
                <span className="ml-2 font-medium">
                  {result.transactionCount}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <span className="ml-2 font-medium">
                  ₹{result.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* JSON Output */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transaction Data (JSON)</h3>
              <button
                onClick={downloadJSON}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download JSON</span>
              </button>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                      Payee
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.transactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm border-b">
                        {transaction.date}
                      </td>
                      <td className="px-4 py-2 text-sm border-b">
                        ₹{transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm border-b break-all">
                        {transaction.payee}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionAnalyzer;
