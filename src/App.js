import "./App.css";
import Navbar from "./components/Navbar";
import React, { useEffect, useState } from "react";

function App() {
  const [waterLevelData, setWaterLevelData] = useState([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // Default to 5 seconds
  const [isPumpOn, setIsPumpOn] = useState(false); // State to manage pump status
  const [tankDepth, setTankDepth] = useState(0); // State to manage tank depth input

  useEffect(() => {
    if (isAutoRefresh) {
      getApiCall();
      const interval = setInterval(() => {
        getApiCall();
      }, refreshInterval); // Refresh based on the selected interval

      return () => clearInterval(interval); // Cleanup interval on component unmount or when auto-refresh is toggled off
    }
  }, [isAutoRefresh, refreshInterval]);

  const getApiCall = async () => {
    try {
      const data = await fetch(
        "http://15.206.193.12/nkdawatersupply/seewaterlevel/"
      );
      const dataJson = await data.json();
      console.log("getApi", dataJson);
      const reversedData = dataJson.reverse();
      setWaterLevelData(reversedData); // Reverse the data to show the latest data first

      // Update pump status based on the latest data
      if (reversedData.length > 0) {
        const latestData = reversedData[0];
        setIsPumpOn(latestData.pump_status);

        // Calculate the percentage and check if it exceeds 80%
        const percentage = calculatePercentage(latestData.level);
        if (percentage > 80 && isPumpOn) {
          alert(
            "Water level exceeds 80%. Pump will be turned off automatically."
          );
          togglePumpStatus(false); // Turn off the pump automatically
        }
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const togglePumpStatus = async (status = !isPumpOn) => {
    try {
      const response = await fetch(
        "http://15.206.193.12/nkdawatersupply/togglepump/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pump: status ? 0 : 1 }),
        }
      );
      if (response.ok) {
        setIsPumpOn(status); // Update pump status locally
        getApiCall(); // Refresh the data to show the updated pump status
      } else {
        console.error("Failed to update pump status");
      }
    } catch (error) {
      console.error("Error updating pump status: ", error);
    }
  };

  const handleToggle = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  const handleRefreshIntervalChange = (event) => {
    const value = event.target.value;
    setRefreshInterval(Number(value));
  };

  const handleTankDepthChange = (event) => {
    const value = Math.min(500, Number(event.target.value)); // Ensure the maximum depth is 500 cm
    setTankDepth(value);
  };

  const getBlinkingIcon = (level) => {
    if (level > 100) {
      return <div className="icon red"></div>;
    } else if (level >= 40 && level <= 100) {
      return <div className="icon green"></div>;
    } else {
      return <div className="icon blue"></div>;
    }
  };

  const calculatePercentage = (level) => {
    if (tankDepth === 0) return 0;
    return ((level / tankDepth) * 100).toFixed(2);
  };

  return (
    <React.Fragment>
      <Navbar />
      <h1 id="h1">Water Level Status</h1>
      <div className="controls">
        <input
          type="number"
          placeholder="Enter tank depth (cm)"
          onChange={handleTankDepthChange}
          className="tank-depth-input"
          max={500}
        />
        <button onClick={handleToggle} className="toggle-button">
          {isAutoRefresh ? "Turn Off Auto Refresh" : "Turn On Auto Refresh"}
        </button>
        <select
          onChange={handleRefreshIntervalChange}
          className="refresh-interval-dropdown"
        >
          <option value={5000}>5 seconds</option>
          <option value={30000}>30 seconds</option>
          <option value={60000}>1 minute</option>
        </select>
        <button onClick={() => togglePumpStatus()} className="toggle-button">
          {isPumpOn ? "Turn Off Pump" : "Turn On Pump"}
        </button>
      </div>
      <div className="container">
        <table className="table table-light table-hover table-bordered">
          <thead className="table-dark">
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Water Level (cm)</th>
              <th scope="col">Water Level (%)</th>
              <th scope="col">Pump Status</th>
              <th scope="col">Indicator</th>
            </tr>
          </thead>
          <tbody id="table_body">
            {waterLevelData.map((item, index) => (
              <tr key={item.id} className={index < 5 ? "highlight" : ""}>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>{item.level} cm</td>
                <td>{calculatePercentage(item.level)}%</td>
                <td>{item.pump_status ? "On" : "Off"}</td>
                <td>{getBlinkingIcon(item.level)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="footer">
        <img
          src="powered_by.png"
          alt="Powered By"
          className="powered-by-image"
        />
        <p>Powered By</p>
      </div>
    </React.Fragment>
  );
}

export default App;
