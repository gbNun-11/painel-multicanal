import { Building2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Card, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

const CreateEnterprisesPage = () => {
  return (
    <div className="h-screen w-screen items-center justify-center flex">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>
                <Building2 className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            Cadastre a empresa.
          </CardTitle>
        </CardHeader>

        <Separator />
      </Card>
    </div>
  );
};

export default CreateEnterprisesPage;
