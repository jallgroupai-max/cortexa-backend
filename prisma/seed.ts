import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const password = await bcrypt.hash("demo123456", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@cortexa.ai" },
    update: {},
    create: {
      email: "demo@cortexa.ai",
      password,
      profile: {
        create: {
          displayName: "Usuario Demo",
          company: "Cortexa AI",
          bio: "Cuenta de demostración de Cortexa AI Studio",
        },
      },
    },
  });

  // Create default workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Mi Proyecto",
      ownerId: user.id,
    },
  });

  // Create demo agents
  const agentSales = await prisma.agent.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      name: "Asistente de Ventas",
      prompt: 'Eres un asistente de ventas profesional. Ayudas a los clientes con información de productos, precios y disponibilidad. Tu tono es amigable y persuasivo.',
      model: "DeepSeek V3.2",
    },
  });

  const agentSupport = await prisma.agent.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      name: "Soporte Técnico Nivel 1",
      prompt: 'Eres un agente de soporte técnico. Resuelves problemas técnicos comunes como resets de contraseña, problemas de conectividad y errores de software. Tu tono es técnico pero empático.',
      model: "GPT-4o",
    },
  });

  const agentHR = await prisma.agent.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      name: "Agente de RRHH",
      prompt: 'Eres un asistente de recursos humanos. Respondes preguntas sobre políticas de la empresa, vacaciones, beneficios y procesos internos. Tu tono es profesional y cercano.',
      model: "Claude Sonnet 4",
    },
  });

  // Create knowledge sources
  await prisma.knowledgeSource.createMany({
    data: [
      { agentId: agentSales.id, fileName: "catalogo-productos.pdf", fileType: "pdf", status: "Completado" },
      { agentId: agentSales.id, fileName: "politica-precios.pdf", fileType: "pdf", status: "Completado" },
      { agentId: agentSupport.id, fileName: "manual-tecnico.pdf", fileType: "pdf", status: "Completado" },
      { agentId: agentSupport.id, fileName: "faq-soporte.txt", fileType: "txt", status: "Completado" },
      { agentId: agentHR.id, fileName: "manual-empleado.pdf", fileType: "pdf", status: "Completado" },
    ],
  });

  // Create demo workflows
  await prisma.workflow.createMany({
    data: [
      {
        userId: user.id,
        workspaceId: workspace.id,
        name: "Atención al Cliente",
        description: "Flujo automático de atención y escalamiento",
        status: "active",
        nodes: JSON.parse('[{"id":"trigger-1","type":"service","position":{"x":250,"y":100},"data":{"label":"Trigger","serviceType":"trigger","description":"Mensaje entrante","active":true}},{"id":"bot-1","type":"service","position":{"x":250,"y":250},"data":{"label":"Clasificar Intent","serviceType":"bot","description":"Clasifica la intención","active":true}},{"id":"bot-2","type":"service","position":{"x":100,"y":400},"data":{"label":"Ventas","serviceType":"bot","description":"Redirige a ventas","active":true}},{"id":"bot-3","type":"service","position":{"x":400,"y":400},"data":{"label":"Soporte","serviceType":"bot","description":"Redirige a soporte","active":true}}]'),
        edges: JSON.parse('[{"id":"e1","source":"trigger-1","target":"bot-1","animated":true},{"id":"e2","source":"bot-1","target":"bot-2","animated":true},{"id":"e3","source":"bot-1","target":"bot-3","animated":true}]'),
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        name: "Onboarding Empleados",
        description: "Flujo de bienvenida para nuevos empleados",
        status: "draft",
        nodes: JSON.parse('[]'),
        edges: JSON.parse('[]'),
      },
    ],
  });

  // Create demo billing orders
  await prisma.billingOrder.createMany({
    data: [
      { userId: user.id, description: "Plan Pro - Marzo 2026", amount: 49.00, currency: "USD", status: "approved" },
      { userId: user.id, description: "Plan Pro - Febrero 2026", amount: 49.00, currency: "USD", status: "approved" },
      { userId: user.id, description: "Créditos adicionales x500", amount: 15.00, currency: "USD", status: "approved" },
    ],
  });

  console.log("Seed completado exitosamente!");
  console.log("Usuario demo: demo@cortexa.ai / demo123456");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
