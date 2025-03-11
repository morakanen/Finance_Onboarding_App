// src/components/AuthTabs.jsx
// src/components/AuthTabs.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AuthTabs({ onLoginSubmit, onRegisterSubmit, setEmail, setPassword, setName }) {
  return (
    <Tabs defaultValue="login" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2 border-none bg-transparent">
        <TabsTrigger value="login" className="login-tab text-sm font-semibold py-2 px-4 bg-orange-600 text-white">
          Login
        </TabsTrigger>
        <TabsTrigger value="register" className="register-tab text-sm font-semibold py-2 px-4 bg-orange-600 text-white">
          Register
        </TabsTrigger>
      </TabsList>

      {/* ✅ Fixed Login Form */}
      <TabsContent value="login">
        <Card className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg mt-4">
          <CardHeader className="bg-zinc-700 p-4 rounded-t-xl">
            <CardTitle className="text-lg font-bold text-white">Login</CardTitle>
            <CardDescription className="text-sm text-zinc-400">Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <form onSubmit={onLoginSubmit}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} />
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" onChange={(e) => setPassword(e.target.value)} />
              <Button type="submit" className="w-full bg-orange-600 text-white mt-4">Login</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ✅ Fixed Register Form */}
      <TabsContent value="register">
        <Card className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg mt-4">
          <CardHeader className="bg-zinc-700 p-4 rounded-t-xl">
            <CardTitle className="text-lg font-bold text-white">Register</CardTitle>
            <CardDescription className="text-sm text-zinc-400">Create a new account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <form onSubmit={onRegisterSubmit}>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" onChange={(e) => setName(e.target.value)} />
              <Label htmlFor="register-email">Email</Label>
              <Input id="register-email" type="email" placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} />
              <Label htmlFor="register-password">Password</Label>
              <Input id="register-password" type="password" onChange={(e) => setPassword(e.target.value)} />
              <Button type="submit" className="w-full bg-orange-600 text-white mt-4">Create Account</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
