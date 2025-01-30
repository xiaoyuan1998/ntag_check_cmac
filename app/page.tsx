"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, XCircle } from "lucide-react"

export default function Home() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    isSuccess: boolean;
    message: string;
  }>({
    isOpen: false,
    isSuccess: false,
    message: "",
  })

  const handleVerify = async () => {
    if (!url) {
      toast.error("Veuillez saisir l'URL")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      setDialogState({
        isOpen: true,
        isSuccess: data.valid,
        message: data.valid 
          ? "La validation de l'URL a été effectuée avec succès !"
          : data.message || "Échec de la validation de l'URL",
      })
    } catch (error) {
      setDialogState({
        isOpen: true,
        isSuccess: false,
        message: "Une erreur s'est produite lors de la validation",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Validateur d'URL</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            type="url" 
            placeholder="Entrez l'URL (ex: https://www.example.com)" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            className="mb-4"
          />
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleVerify} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Validation en cours..." : "Valider"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog 
        open={dialogState.isOpen} 
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${dialogState.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {dialogState.isSuccess ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              {dialogState.isSuccess ? 'Validation Réussie' : 'Échec de la Validation'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-lg text-gray-700">
              {dialogState.message}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
