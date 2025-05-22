import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface QrCodeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
}

function QrCodeContent({ accountId, className }: { accountId: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(accountId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      <div className="relative">
        {/* Decorative gradient background */}
        <div className="absolute -inset-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-[32px] blur-sm" />
        
        {/* QR Code container */}
        <div className="relative bg-white p-8 rounded-3xl shadow-xl">
          <QRCodeSVG
            value={accountId}
            size={280}
            level="H"
            className="w-full h-full"
            bgColor="#ffffff"
            fgColor="#134e4a" // teal-900
          />
        </div>
      </div>

      <div className="w-full space-y-2.5">
        <div className="flex items-center justify-center gap-2">
          <div className="text-sm font-medium text-gray-600">DAO Wallet Address</div>
        </div>
        <div className="flex items-center gap-2 w-full">
          <code className="flex-1 bg-gray-50 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-900 border border-gray-100 break-all text-center">
            {accountId}
          </code>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12 shrink-0 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200",
              copied && "border-teal-500 text-teal-500 bg-teal-50 hover:bg-teal-50"
            )}
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function QrCode({ open, onOpenChange, accountId }: QrCodeProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Deposit to wallet</DialogTitle>
            <DialogDescription className="text-base text-gray-500 text-center">
              Scan this QR code or copy the address to deposit assets to your wallet.
            </DialogDescription>
          </DialogHeader>
          <QrCodeContent accountId={accountId} className="my-6" />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl">Deposit to wallet</DrawerTitle>
          <DrawerDescription className="text-base text-gray-500">
            Scan this QR code or copy the address to deposit assets to your wallet.
          </DrawerDescription>
        </DrawerHeader>
        <QrCodeContent accountId={accountId} className="px-6 pb-0" />
        <DrawerFooter>
          <DrawerClose asChild>
            <Button 
              variant="outline" 
              className="border-gray-200 hover:bg-gray-50"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
