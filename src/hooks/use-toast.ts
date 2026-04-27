"use client"

import * as React from "react"
import { toast as sonnerToast, type ExternalToast } from "sonner"

// Sonner handles its own toast management, so we don't need most of the custom implementation
// We'll create a simple wrapper around sonner's API

type ToastOptions = Omit<ExternalToast, "description"> & {
  description?: React.ReactNode
}

const toast = (title: string, options?: ToastOptions) => {
  return sonnerToast(title, {
    ...options,
    description: options?.description as string | undefined,
  })
}

toast.success = (title: string, options?: ToastOptions) => 
  sonnerToast.success(title, {
    ...options,
    description: options?.description as string | undefined,
  })

toast.error = (title: string, options?: ToastOptions) => 
  sonnerToast.error(title, {
    ...options,
    description: options?.description as string | undefined,
  })

toast.warning = (title: string, options?: ToastOptions) => 
  sonnerToast.warning(title, {
    ...options,
    description: options?.description as string | undefined,
  })

toast.info = (title: string, options?: ToastOptions) => 
  sonnerToast.info(title, {
    ...options,
    description: options?.description as string | undefined,
  })

toast.dismiss = sonnerToast.dismiss
toast.promise = sonnerToast.promise

export { toast }