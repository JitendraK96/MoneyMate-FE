import { useState } from "react";
import { Form, FormField } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, Password, Button } from "@/components/inputs";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Accesscontrol from "@/components/accesscontrol";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";

const FormSchema = z.object({
  emailaddress: z
    .string()
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character.",
    }),
});

const Signin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      emailaddress: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    const { emailaddress, password } = data;
    const { error, data: loginData } = await supabase.auth.signInWithPassword({
      email: emailaddress,
      password: password,
    });

    if (error) {
      console.error("Login error:", error.message);
      alert(error.message);
      setIsLoading(false);
      return;
    }

    console.log("Login successful:", loginData);
    navigate("/dashboard");
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error("Google login error:", error.message);
      alert("Google login failed. Please try again.");
    }
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <Accesscontrol
      formTitle="Log in"
      formSubTitle="Don’t have an account?"
      onSubTitleNavigateTitleClick={handleSignupRedirect}
      subTitleNavigateTitle="Get started"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="">
          <div className="mt-8 mb-10 space-y-5">
            <FormField
              control={form.control}
              name="emailaddress"
              render={({ field }) => (
                <Input
                  field={field}
                  type="email"
                  placeholder="john.doe@gmail.com"
                  label="Email Address"
                />
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <Password
                  field={field}
                  placeholder="Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  label="Password"
                />
              )}
            />
          </div>
          <Button
            type="submit"
            isLoading={isLoading}
            title="Submit"
            variant={"outline"}
            className="w-full !bg-[var(--palette-button)]"
          />
        </form>
      </Form>
      <div className="flex items-center gap-4 mt-[20px] mb-[20px]">
        <Separator className="flex-1 bg-[var(--palette-text-placeholder)] opacity-40" />
        <span className="text-[var(--palette-text-tertiary)] text-sm font-medium">
          or
        </span>
        <Separator className="flex-1 bg-[var(--palette-text-placeholder)] opacity-40" />
      </div>
      <Button
        variant="outline"
        onClick={handleGoogleSignIn}
        type="button"
        title={
          <span className="text-[var(--palette-text-tertiary)] font-size-small">
            Sign in with google
          </span>
        }
        icon={<FcGoogle size={20} />}
        className="bg-transparent hover:bg-transparent !border-[0.5px] border-[var(--palette-border)]"
      ></Button>
    </Accesscontrol>
  );
};

export default Signin;
