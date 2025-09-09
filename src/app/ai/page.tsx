'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Sparkles, 
  MessageCircle, 
  Lightbulb, 
  Settings, 
  Zap 
} from 'lucide-react'

export default function AIPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            Asistente IA ZetterX
          </h1>
          <p className="text-muted-foreground">
            Inteligencia artificial para optimizar tu negocio de vidrio y aluminio
          </p>
        </div>
        <Badge variant="secondary" className="text-orange-600 border-orange-200">
          <Sparkles className="mr-1 h-3 w-3" />
          Próximamente
        </Badge>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
            <Bot className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">🚧 En Construcción 🚧</CardTitle>
          <CardDescription className="text-lg">
            Estamos desarrollando un asistente de IA revolucionario para tu CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Nuestro equipo está trabajando en funcionalidades increíbles que transformarán 
            la manera en que gestionas tu negocio de manufactura de vidrio y aluminio.
          </p>
          <div className="flex justify-center">
            <Button disabled className="bg-orange-200 text-orange-800">
              <Zap className="mr-2 h-4 w-4" />
              Disponible Pronto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Chatbot Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Responde preguntas sobre inventario, clientes, órdenes y productos 
              usando procesamiento de lenguaje natural.
            </p>
            <ul className="mt-3 text-sm space-y-1">
              <li>• Consultas en tiempo real</li>
              <li>• Análisis de datos</li>
              <li>• Recomendaciones personalizadas</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-600" />
              Predicción de Demanda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analiza patrones históricos para predecir qué productos 
              tendrán mayor demanda en el futuro.
            </p>
            <ul className="mt-3 text-sm space-y-1">
              <li>• Previsión de inventario</li>
              <li>• Optimización de stock</li>
              <li>• Alertas automáticas</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Automatización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatiza tareas repetitivas como seguimiento de órdenes, 
              recordatorios de pago y programación de instalaciones.
            </p>
            <ul className="mt-3 text-sm space-y-1">
              <li>• Workflows automáticos</li>
              <li>• Notificaciones inteligentes</li>
              <li>• Programación optimizada</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              Análisis de Cotizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              IA que analiza cotizaciones para optimizar precios y 
              maximizar probabilidades de aprobación.
            </p>
            <ul className="mt-3 text-sm space-y-1">
              <li>• Precios competitivos</li>
              <li>• Análisis de mercado</li>
              <li>• Recomendaciones de mejora</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              Insights de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Comprende mejor a tus clientes con análisis de comportamiento 
              y patrones de compra personalizados.
            </p>
            <ul className="mt-3 text-sm space-y-1">
              <li>• Segmentación automática</li>
              <li>• Perfiles de cliente</li>
              <li>• Oportunidades de venta</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Optimización DGI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatiza y optimiza el proceso de facturación electrónica 
              con la DGI de Panamá usando IA.
            </p>
            <ul className="mt-3 text-sm space-y-1">
              <li>• Validación automática</li>
              <li>• Corrección de errores</li>
              <li>• Cumplimiento fiscal</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Mock Chatbot Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Vista Previa del Chatbot
          </CardTitle>
          <CardDescription>
            Así se verá la interfaz del asistente de IA cuando esté listo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px]">
            <div className="space-y-4">
              {/* Bot Message */}
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Bot className="h-8 w-8 p-2 bg-blue-100 text-blue-600 rounded-full" />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-[80%]">
                  <p className="text-sm">
                    ¡Hola! Soy tu asistente de IA para ZetterX. 
                    Puedo ayudarte con consultas sobre inventario, clientes, órdenes y mucho más.
                  </p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex gap-3 justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-3 shadow-sm max-w-[80%]">
                  <p className="text-sm">
                    ¿Cuántas ventanas de aluminio tengo en stock?
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    Tú
                  </div>
                </div>
              </div>

              {/* Bot Response */}
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Bot className="h-8 w-8 p-2 bg-blue-100 text-blue-600 rounded-full" />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-[80%]">
                  <p className="text-sm">
                    📊 Según tu inventario actual, tienes:
                    <br />• 12 Ventanas Corredizas Aluminio 1.20x1.00
                    <br />• 8 Ventanas Corredizas Aluminio 1.50x1.20
                    <br />• 5 Ventanas Corredizas Aluminio 2.00x1.50
                    <br />
                    <br />Total: 25 unidades de ventanas de aluminio
                    <br />💡 Recomiendo reabastecer el modelo 2.00x1.50
                  </p>
                </div>
              </div>
            </div>

            {/* Input Field (Disabled) */}
            <div className="mt-6 border-t pt-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Escribe tu pregunta aquí..." 
                  disabled
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-100 text-gray-400"
                />
                <Button disabled size="sm">
                  Enviar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Esta es solo una vista previa. El chatbot estará disponible próximamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Hoja de Ruta de Desarrollo</CardTitle>
          <CardDescription>
            Cronograma estimado para el lanzamiento de funcionalidades IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Fase 1: Chatbot Básico</p>
                <p className="text-sm text-muted-foreground">Q2 2024 - Consultas simples de inventario y clientes</p>
              </div>
              <Badge variant="secondary">En Desarrollo</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Fase 2: Análisis Predictivo</p>
                <p className="text-sm text-muted-foreground">Q3 2024 - Predicción de demanda y recomendaciones</p>
              </div>
              <Badge variant="outline">Planeado</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Fase 3: Automatización Completa</p>
                <p className="text-sm text-muted-foreground">Q4 2024 - Workflows automáticos y optimización DGI</p>
              </div>
              <Badge variant="outline">Futuro</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  )
}
