import React from "react";

const Footer = () => {
  return (
    <footer className="bg-zinc-800 text-zinc-400 text-center p-4 mt-auto border-t-2 border-orange-500 w-full">
      <p>&copy; {new Date().getFullYear()} Client Management System</p>
    </footer>
  );
};

export default Footer;
