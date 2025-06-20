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
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." }),
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

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      emailaddress: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    const { emailaddress, password, name } = data;
    const { error } = await supabase.auth.signUp({
      email: emailaddress,
      password: password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error.message);
      alert(error.message);
      setIsLoading(false);
      return;
    }

    navigate("/dashboard");
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error("Google signup error:", error.message);
      alert("Google Signup failed. Please try again.");
    }
  };

  const handleSigninRedirect = () => {
    navigate("/signin");
  };

  return (
    <Accesscontrol
      formTitle="Sign up"
      formSubTitle="Already have an account?"
      onSubTitleNavigateTitleClick={handleSigninRedirect}
      subTitleNavigateTitle="Login now"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mt-8 mb-10 space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <Input
                  field={field}
                  type="text"
                  placeholder="John Doe"
                  label="Name"
                />
              )}
            />
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
            title="Create account"
            className="w-full !bg-[var(--common-brand)]"
          />
        </form>
      </Form>
      <div className="flex items-center gap-4 mt-[20px] mb-[20px]">
        <Separator className="flex-1 bg-[var(--common-seperator)] opacity-40" />
        <span className="text-[var(--accesscontrol-textsecondary)] text-sm font-medium">
          or
        </span>
        <Separator className="flex-1 bg-[var(--common-seperator)] opacity-40" />
      </div>
      <Button
        type="button"
        onClick={handleGoogleSignUp}
        title={
          <span className="text-[var(--accesscontrol-textprimary)] font-size-small">
            Sign up with google
          </span>
        }
        icon={<FcGoogle size={20} />}
        className="bg-transparent hover:bg-transparent !border-[0.5px] !border-[var(--accesscontrol-buttonborder)]"
      ></Button>
    </Accesscontrol>
  );
};

export default Signup;
