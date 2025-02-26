import React, { useState } from "react";
import api from "../utils/api";

const ClientForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/add-clients", formData);
      if (response.status === 201 || response.status === 200) {
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
    <div>
      <h2>Add Client</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
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