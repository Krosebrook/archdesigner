import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  onConfirm, 
  isDeleting = false,
  itemName = "this item" 
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </motion.div>
          <AlertDialogTitle className="text-center text-xl">
            {title || "Confirm Deletion"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            {description || `Are you sure you want to delete ${itemName}? This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 sm:justify-center">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="min-w-[120px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-w-[120px] bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}