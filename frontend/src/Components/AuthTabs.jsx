// src/components/AuthTabs.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    } 
  },
  exit: { opacity: 0, y: -20 }
};

const inputVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: i => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5
    }
  })
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, backgroundColor: "#c2410c" },
  tap: { scale: 0.95 }
};

export function AuthTabs({ onLoginSubmit, onRegisterSubmit, setEmail, setPassword, setName }) {
  const [activeTab, setActiveTab] = useState("login");
  
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-[400px] z-10"
    >
      <Tabs 
        defaultValue="login" 
        className="w-full" 
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-2 border-none bg-transparent overflow-hidden rounded-t-xl">
          <motion.div 
            className="absolute bottom-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600" 
            style={{ 
              width: "50%", 
              left: activeTab === "login" ? "0%" : "50%",
              transition: "left 0.3s ease-in-out",
              background: "linear-gradient(to right, #f97316, #ea580c)" // Matching the button color
            }}
          />
          <TabsTrigger 
            value="login" 
            className="login-tab text-sm font-semibold py-3 px-4 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white relative overflow-hidden group"
          >
            <span className="relative z-10">Login</span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" 
              initial={{ opacity: 0 }}
              animate={{ opacity: activeTab === "login" ? 0.2 : 0 }}
            />
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            className="register-tab text-sm font-semibold py-3 px-4 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white relative overflow-hidden group"
          >
            <span className="relative z-10">Register</span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" 
              initial={{ opacity: 0 }}
              animate={{ opacity: activeTab === "register" ? 0.2 : 0 }}
            />
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* Login Form */}
          <TabsContent value="login" className="mt-0">
            <motion.div
              key="login"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl mt-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-5 rounded-t-xl border-b border-zinc-700/30">
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <motion.span 
                        animate={{ 
                          color: ["#f97316", "#ffffff", "#f97316"],
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }}
                      >
                        ⚡
                      </motion.span> 
                      Login
                    </CardTitle>
                    <CardDescription className="text-sm text-zinc-400 mt-1">Enter your credentials to access your account.</CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <form onSubmit={onLoginSubmit} className="space-y-4">
                    <motion.div custom={0} variants={inputVariants} initial="hidden" animate="visible">
                      <Label htmlFor="email" className="text-zinc-300 font-medium">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500 text-white placeholder:text-zinc-400 caret-orange-500"
                        style={{ color: 'white', fontWeight: '500' }}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </motion.div>
                    <motion.div custom={1} variants={inputVariants} initial="hidden" animate="visible">
                      <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Password" 
                        className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500 text-white placeholder:text-zinc-400 caret-orange-500"
                        style={{ color: 'white', fontWeight: '500' }}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </motion.div>
                    <motion.div custom={2} variants={inputVariants} initial="hidden" animate="visible" className="pt-2">
                      <motion.div
                        variants={buttonVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 rounded-md shadow-lg shadow-orange-600/20 transition-all duration-300"
                        >
                          Login
                        </Button>
                      </motion.div>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register" className="mt-0">
            <motion.div
              key="register"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl mt-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-5 rounded-t-xl border-b border-zinc-700/30">
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <motion.span 
                        animate={{ 
                          color: ["#f97316", "#ffffff", "#f97316"],
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }}
                      >
                        ✨
                      </motion.span> 
                      Register
                    </CardTitle>
                    <CardDescription className="text-sm text-zinc-400 mt-1">Create a new account to get started.</CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <form onSubmit={onRegisterSubmit} className="space-y-4">
                    <motion.div custom={0} variants={inputVariants} initial="hidden" animate="visible">
                      <Label htmlFor="name" className="text-zinc-300 font-medium">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        onChange={(e) => setName(e.target.value)} 
                        className="mt-1 bg-zinc-900/50 border-zinc-700 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                      />
                    </motion.div>
                    <motion.div custom={1} variants={inputVariants} initial="hidden" animate="visible">
                      <Label htmlFor="register-email" className="text-zinc-300 font-medium">Email</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="name@example.com" 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="mt-1 bg-zinc-800/50 border-zinc-700 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 text-white placeholder:text-zinc-400 caret-orange-500"
                      />
                    </motion.div>
                    <motion.div custom={2} variants={inputVariants} initial="hidden" animate="visible">
                      <Label htmlFor="register-password" className="text-zinc-300 font-medium">Password</Label>
                      <Input 
                        id="register-password" 
                        type="password" 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="mt-1 bg-zinc-900/50 border-zinc-700 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                      />
                    </motion.div>
                    <motion.div custom={3} variants={inputVariants} initial="hidden" animate="visible" className="pt-2">
                      <motion.div
                        variants={buttonVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 rounded-md shadow-lg shadow-orange-600/20 transition-all duration-300"
                        >
                          Create Account
                        </Button>
                      </motion.div>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
