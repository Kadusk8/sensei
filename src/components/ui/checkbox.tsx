import * as React from "react"
// import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => (
    // Using a simple input checkbox hidden and a custom styled label for simplicity without Radix
    // Actually, standard HTML checkbox styled is easier for now without Radix Primitive
    <div className="relative flex items-center">
        <input
            type="checkbox"
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground accent-primary",
                className
            )}
            ref={ref}
            {...props}
        />
    </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
