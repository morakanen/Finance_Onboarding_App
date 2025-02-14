import React from "react";

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <p>&copy; {new Date().getFullYear()} Client Management System</p>
    </footer>
  );
};

const styles = {
  footer: {
    background: "#333",
    color: "white",
    textAlign: "center",
    padding: "10px 0",
    position: "absolute",
    bottom: "0",
    width: "100%"
  }
};

export default Footer;