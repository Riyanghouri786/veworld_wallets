"use client";
import { useEffect } from "react";

const ApiCaller = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Call B3TR transfer API
        const res1 = await fetch("/api/wallet/check_and_transfer");
        const data1 = await res1.json();
        console.log("check_and_transfer response:", data1);

        // Call VTHO transfer API
        const res2 = await fetch("/api/wallet/transfer_vtho");
        const data2 = await res2.json();
        console.log("transfer_vtho response:", data2);
      } catch (err) {
        console.error("API error:", err);
      }
    };

    fetchData(); // call immediately on mount
    const interval = setInterval(fetchData, 60 * 60 * 1000); // every 1 hour

    return () => clearInterval(interval); // cleanup
  }, []);

  return null; // background-only component
};

export default ApiCaller;
