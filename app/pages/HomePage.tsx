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
import CreatePartyDialog from "../components/CreatePartyDialog";

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
        <CreatePartyDialog />
        <JoinPartyDialog />
      </div>
      <div
        aria-hidden="true"
        className="absolute text-[150px] bottom-5 opacity-20"
      >
        🐉
      </div>
    </section>
  );
};

export default HomePage;
