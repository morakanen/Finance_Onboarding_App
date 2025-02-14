import React, { useState } from "react";
import api from "../utils/api"; // Import the Axios instance

const ClientForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/clients", formData); // Using Axios

      if (response.status === 200 || response.status === 201) {
        setMessage("Client added successfully!");
        setFormData({ name: "", email: "", phone: "" });
      } else {
        setMessage("Failed to add client.");
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.message || "Server error"}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Add Client</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Phone:</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} />

        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    width: "50%",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    textAlign: "center"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  }
};

export default ClientForm;