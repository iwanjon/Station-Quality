import React, { useEffect, useState } from 'react';

function App() {
  const [backendData, setBackendData] = useState([{}]);

  useEffect(() => {
    fetch("/api")
      .then(response => response.json())
      .then(data => {
        setBackendData(data);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        
      });
  }, []); 

  return (
    <div>
      {(typeof backendData.users === 'undefined') ? (
        <p>Loading...</p>
      ) : (
        Array.isArray(backendData.users) && backendData.users.length > 0 ? (
          backendData.users.map((user, i) => (
            <p key={i}>{user}</p>
          ))
        ) : (
          <p>No users found.</p> 
        )
      )}
    </div>
  );
}

export default App;