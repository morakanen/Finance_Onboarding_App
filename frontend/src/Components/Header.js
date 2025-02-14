import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header style={styles.header}>
      <h1>Client Onboarding</h1>
      <nav>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/add-client" style={styles.link}>Add Client</Link>
      </nav>
    </header>
  );
};

const styles = {
  header: {
    background: "#333",
    color: "white",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  link: {
    color: "white",
    textDecoration: "none",
    marginLeft: "15px"
  }
};

export default Header;