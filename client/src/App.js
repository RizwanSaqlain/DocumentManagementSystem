import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [classification, setClassification] = useState(''); // State to store classification result

  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('http://localhost:5000/get-dummy-data');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, []);



  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Extract the classification from the server response
      const { extractedText, classification } = response.data;
      setClassification(classification); // Store classification in state
      alert(`File uploaded successfully.`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Retrieved Data</h1>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            {item.name} - {item.candidateId}
          </li>
        ))}
      </ul>
      <ul>Random Item</ul>
      <h1>Document Upload</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      
      {/* Display the classification result */}
      {classification && (
        <div style={{ marginTop: '20px' }}>
          <h2>Classification Result from Llama3:</h2>
          <p>{classification}</p>
        </div>
      )}
    </div>

    
  );
}

export default App;
