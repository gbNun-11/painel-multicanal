import { UserIcon } from "lucide-react";

import SignupForm from "@/src/components/signup-form";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Card, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

const AuthenticationPage = () => {
  return (
    <div className="h-screen w-screen items-center justify-center flex">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            Faça o novo cadastro.
          </CardTitle>
        </CardHeader>

        <Separator />

        <SignupForm />
      </Card>
    </div>
  );
};

export default AuthenticationPage;
