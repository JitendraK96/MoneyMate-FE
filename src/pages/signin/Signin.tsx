import { useState } from "react";
import Budget from "@/assets/videos/budget.mp4";
import Logo from "@/assets/images/f-logo-light.svg";
import { Form, FormField } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, Password, Button } from "@/components/inputs";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

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
      alert(error.message); // or show a toast
      setIsLoading(false);
      return;
    }

    console.log("Login successful:", loginData);
    navigate("/dashboard");
  };

  return (
    <div className="signup flex justify-between h-full">
      <div className="basis-[50%] bg-[var(--tertiary)] relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={Budget} type="video/mp4" />
        </video>
        <img src={Logo} alt="Logo" className="absolute top-5 left-5 w-50" />
      </div>
      <div className="basis-[50%] bg-[var(--tertiary)] pt-20 pr-30 pb-20 pl-30">
        <h4 className="text-[var(--font-primary)] font-extra-large font-bold">
          Sign in to MoneyMate
        </h4>
        <h6 className="text-[var(--secondary)] font-extra-small mt-[2px] mb-10">
          Enter your account details below
        </h6>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button
              type="submit"
              isLoading={isLoading}
              title="Submit"
              variant={"outline"}
              className="w-full"
            />
          </form>
        </Form>
        <Separator className="mt-10 mb-10 bg-[var(--secondary)] opacity-10" />
        <div className="flex justify-center">
          <Button
            icon={<FcGoogle size={20} />}
            type="button"
            title="Sign In with Google"
            variant={"outline"}
            className="rounded-[10px] border-[var(--secondary)]"
          />
        </div>
      </div>
    </div>
  );
};

export default Signin;
