"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// 配置服务器端渲染
export const runtime = 'edge'
export const preferredRegion = 'auto'

interface VerificationSteps {
  input: {
    url: string
    uid: string
    ctr: string
    cmac: string
  }
  ctrConversion: string[]
  sv2Construction: string[]
  hmacCalculation: string[]
  sdmmacCalculation: string[]
  comparison: {
    calculatedSdmmac: string
    providedCmac: string
    match: boolean
  }
}

interface VerificationResult {
  valid: boolean
  message?: string
  steps: VerificationSteps
}

export default function Verify() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyUrl = async () => {
      if (url) {
        try {
          const response = await fetch("/api/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
          })
          const data = await response.json()
          setResult(data)
        } catch (error) {
          setResult({
            valid: false,
            message: "Une erreur s'est produite lors de la validation",
            steps: {} as VerificationSteps
          })
        } finally {
          setLoading(false)
        }
      }
    }

    verifyUrl()
  }, [url])

  const renderStepTitle = (title: string, valid?: boolean) => (
    <h3 className={`font-semibold text-lg mb-2 ${
      valid === undefined ? '' : valid ? 'text-green-600' : 'text-red-600'
    }`}>
      {title}
    </h3>
  )

  const renderCodeBlock = (label: string, code: string) => (
    <div className="mb-2">
      <p className="text-sm text-gray-600">{label}:</p>
      <code className="block bg-gray-50 p-2 rounded font-mono text-sm overflow-x-auto">
        {code}
      </code>
    </div>
  )

  const renderSteps = (steps: string[]) => (
    <div className="bg-gray-50 p-4 rounded space-y-1">
      {steps.map((step, index) => (
        <pre key={index} className="font-mono text-sm whitespace-pre-wrap">
          {step}
        </pre>
      ))}
    </div>
  )

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Paramètre URL manquant</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.history.back()} className="w-full">
              Retour
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Résultat de la Validation d'URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p>Validation en cours...</p>
          ) : result ? (
            <>
              {/* État de la validation */}
              <div>
                {renderStepTitle("État de la Validation", result.valid)}
                <p className={result.valid ? "text-green-600" : "text-red-600"}>
                  {result.valid ? "Validation réussie ✓" : "Validation échouée ✗"}
                </p>
                {result.message && (
                  <p className="text-gray-600 mt-2">{result.message}</p>
                )}
              </div>

              {/* Paramètres d'entrée */}
              <div>
                {renderStepTitle("1. Paramètres d'entrée")}
                {renderCodeBlock("URL complète", result.steps.input.url)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {renderCodeBlock("UID", result.steps.input.uid)}
                  {renderCodeBlock("CTR", result.steps.input.ctr)}
                  {renderCodeBlock("CMAC", result.steps.input.cmac)}
                </div>
              </div>

              {/* Conversion CTR */}
              <div>
                {renderStepTitle("2. Processus de conversion CTR")}
                {renderSteps(result.steps.ctrConversion)}
              </div>

              {/* Construction SV2 */}
              <div>
                {renderStepTitle("3. Processus de construction SV2")}
                {renderSteps(result.steps.sv2Construction)}
              </div>

              {/* Calcul HMAC */}
              <div>
                {renderStepTitle("4. Processus de calcul HMAC")}
                {renderSteps(result.steps.hmacCalculation)}
              </div>

              {/* Calcul SDMMAC */}
              <div>
                {renderStepTitle("5. Processus de calcul SDMMAC")}
                {renderSteps(result.steps.sdmmacCalculation)}
              </div>

              {/* Résultat de la comparaison */}
              <div>
                {renderStepTitle("6. Comparaison finale", result.steps.comparison.match)}
                <div className="grid grid-cols-1 gap-4">
                  {renderCodeBlock("SDMMAC calculé", result.steps.comparison.calculatedSdmmac)}
                  {renderCodeBlock("CMAC de l'URL", result.steps.comparison.providedCmac)}
                </div>
                <p className={`mt-2 font-semibold ${
                  result.steps.comparison.match ? "text-green-600" : "text-red-600"
                }`}>
                  {result.steps.comparison.match ? "SDMMAC et CMAC correspondent ✓" : "SDMMAC et CMAC ne correspondent pas ✗"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-red-600">Une erreur s'est produite lors de la validation</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.history.back()} className="w-full">
            Retour
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
