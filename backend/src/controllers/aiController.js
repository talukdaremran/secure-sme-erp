const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function getAiServiceHealth(req, res, next) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);

    if (!response.ok) {
      return res.status(502).json({
        status: "error",
        message: "AI service is not responding correctly",
        data: {
          connected: false,
          aiServiceUrl: AI_SERVICE_URL,
        },
      });
    }

    const aiHealth = await response.json();

    res.status(200).json({
      status: "success",
      message: "AI service connection successful",
      data: {
        connected: true,
        aiServiceUrl: AI_SERVICE_URL,
        aiService: aiHealth,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Unable to connect to AI service",
      data: {
        connected: false,
        aiServiceUrl: AI_SERVICE_URL,
        error: error.message,
      },
    });
  }
}