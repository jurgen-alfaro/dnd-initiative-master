"use client";
import { type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SwordsIcon, HandshakeIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Modal from "../components/Modal";
import JoinPartyDialog from "../components/JoinPartyDialog";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Setup form fields state
  const [code, setCode] = useState("");

  // TODO: These should be imported or implemented
  const loadVehicles = async () => console.log("loadVehicles not implemented");
  const vehicleService = {
    create: async (data: any) => console.log("create vehicle", data),
    update: async (id: string, data: any) =>
      console.log("update vehicle", id, data),
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormError("");
    setFormErrors({});
    setEditingVehicle(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormErrors({});

    // Validation logic (e.g. Zod) goes here if needed

    setFormLoading(true);
    try {
      //   const data = {
      //     make: result.data.make,
      //     model: result.data.model,
      //     year: result.data.year,
      //     currentMileage: result.data.currentMileage,
      //     vin: result.data.vin || undefined,
      //   };

      //   if (editingVehicle) {
      //     await vehicleService.update(editingVehicle.id, data);
      //   } else {
      //     await vehicleService.create(data);
      //   }

      closeForm();
      setLoading(true);
      //   await loadVehicles();
    } catch {
      setFormError(
        editingVehicle
          ? "Failed to update vehicle"
          : "Failed to create vehicle",
      );
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <section className="relative w-full flex flex-col items-center gap-4 ">
      <h1 className="relative z-10 text-center text-5xl font-extrabold tracking-tight mb-8">
        D&D Initiative Tracker
      </h1>
      <div className="relative z-10 flex gap-4 justify-center">
        <Link href="/party/create">
          <Button size="lg" className="cursor-pointer">
            Create Party
            <SwordsIcon />
          </Button>
        </Link>
        {/* <Button
          size="lg"
          className="cursor-pointer"
          onClick={() => setShowForm(true)}
        >
          Join Party
          <HandshakeIcon />
        </Button> */}
        <JoinPartyDialog />
      </div>{" "}
      <div
        aria-hidden="true"
        className="absolute text-[150px] bottom-5 opacity-20"
      >
        🐉
      </div>
      {/* Add/Edit Modal */}
      {/* <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingVehicle ? "Edit Vehicle" : "Join Party"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{formError}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="make"
              className="block text-sm font-medium text-gray-700"
            >
              Enter Party Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. AB12"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              maxLength={4}
            />
            {formErrors.code && (
              <p className="mt-1 text-sm text-red-600">{formErrors.make}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={closeForm}
              disabled={formLoading}
              className="cursor-pointer rounded-md border border-gray-300  px-4 py-2 text-sm font-medium  shadow-sm disabled:opacity-50"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={formLoading}
              className="cursor-pointer rounded-md border border-gray-300  px-4 py-2 text-sm font-medium  shadow-sm disabled:opacity-50"
            >
              {formLoading ? "Joining..." : "Join Party"}
            </Button>
          </div>
        </form>
      </Modal> */}
    </section>
  );
};

export default HomePage;
