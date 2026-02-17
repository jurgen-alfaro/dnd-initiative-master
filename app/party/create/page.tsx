"use client";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { BadgePlusIcon } from "lucide-react";

const CreatePage = () => {
  const createParty = () => {
    console.log("ASDASD");
  };

  return (
    <section className="min-h-screen flex justify-center items-center max-w-7xl">
      <Card>
        <CardContent>
          Create Party
          <Input
            type="text"
            placeholder="Party Name"
            className="mt-3"
            required
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            type="button"
            className="cursor-pointer rounded-md border border-gray-300  px-4 py-2 text-sm font-medium  shadow-sm disabled:opacity-50"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="cursor-pointer rounded-md border border-gray-300  px-4 py-2 text-sm font-medium  shadow-sm disabled:opacity-50"
          >
            Create Party
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
};

export default CreatePage;
