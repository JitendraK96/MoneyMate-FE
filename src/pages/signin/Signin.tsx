import { useState } from "react";
import { Form, FormField } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, Password, Button } from "@/components/inputs";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Accesscontrol from "@/components/accesscontrol";

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

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <Accesscontrol
      formTitle="Sign in to MoneyMate"
      formSubTitle="Don’t have an account?"
      title="Hi, Welcome back"
      onSubTitleNavigateTitleClick={handleSignupRedirect}
      subTitleNavigateTitle="Get started"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="">
          <div className="mt-5 mb-10 space-y-5">
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
            className="w-full"
          />
        </form>
      </Form>
    </Accesscontrol>
  );
};

export default Signin;
