export const errorHandlers = [
    {
      condition: (error: any) =>
        error?.code === 4001 ||
        error?.code === "ACTION_REJECTED" ||
        error?.message.toLowerCase().includes("user rejected"),
      message: "Transaction cancelled by user.",
    },
    {
      condition: (error: any) => error?.message.toLowerCase().includes("insufficient funds"),
      message: "Insufficient balance to process transaction.",
    },
    {
      condition: (error: any) => error?.message.toLowerCase().includes("timeout"),
      message: "Transaction timed out. Please try again.",
    },
    {
      condition: (error: any) => error?.message.toLowerCase().includes("network"),
      message: "Network error. Please check your connection.",
    },
    {
      condition: (error: any) =>
        error?.message.toLowerCase().includes("relayer service error") &&
        !error?.message.toLowerCase().includes("user rejected"),
      message: "Relayer service error. Try again later.",
    },
  ];
  
  export const getErrorMessage = (error: any): string => {
    // console.error("🚨 Full Error:", error); 
    const handler = errorHandlers.find((handler) => handler.condition(error));
    return handler ? handler.message : `Transaction failed: ${error?.message || "Unknown error"}`;
  };
  