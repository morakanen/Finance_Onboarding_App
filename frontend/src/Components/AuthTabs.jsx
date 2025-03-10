import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AuthTabs() {
  return (
    <Tabs defaultValue="login" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2 border-none bg-transparent">
        <TabsTrigger
          value="login"
          className="login-tab text-sm font-semibold py-2 px-4 border-b-2 border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 active:bg-orange-700 w-full"
        >
          Login
        </TabsTrigger>
        <TabsTrigger
          value="register"
          className="register-tab text-sm font-semibold py-2 px-4 border-b-2 border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 active:bg-orange-700 w-full"
        >
          Register
        </TabsTrigger>
      </TabsList>

      {/* Login Tab */}
      <TabsContent value="login">
        <Card className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg mt-4">
          <CardHeader className="bg-zinc-700 p-4 rounded-t-xl">
            <CardTitle className="text-lg font-bold text-white">Login</CardTitle>
            <CardDescription className="text-sm text-zinc-400">Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <form>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-zinc-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-zinc-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center p-6 space-y-2">
            <Button variant="link" className="text-orange-500 hover:text-orange-600">
              Forgot password?
            </Button>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
              Login
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Register Tab */}
      <TabsContent value="register">
        <Card className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg mt-4">
          <CardHeader className="bg-zinc-700 p-4 rounded-t-xl">
            <CardTitle className="text-lg font-bold text-white">Register</CardTitle>
            <CardDescription className="text-sm text-zinc-400">Create a new account to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <form>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-zinc-200">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm font-semibold text-zinc-200">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-sm font-semibold text-zinc-200">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-semibold text-zinc-200">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="p-6">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
              Create Account
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
