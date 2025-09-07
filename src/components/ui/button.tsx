import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow hover:bg-primary-600 focus-visible:ring-primary-500",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500",
        outline: "border border-primary-200 bg-white text-primary-700 shadow-sm hover:bg-primary-50 hover:text-primary-800 focus-visible:ring-primary-500",
        secondary: "bg-secondary-100 text-secondary-900 shadow-sm hover:bg-secondary-200 focus-visible:ring-secondary-500",
        ghost: "hover:bg-primary-50 hover:text-primary-900 focus-visible:ring-primary-500",
        link: "text-primary-700 underline-offset-4 hover:underline focus-visible:ring-primary-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

