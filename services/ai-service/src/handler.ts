import { APIGatewayProxyHandler } from 'aws-lambda';
import { AnalyzeInventoryUseCase } from './application/usecases/AnalyzeInventoryUseCase';
import { OpenAIAdapter } from './infrastructure/adapters/OpenAIAdapter';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const analyzeInventory: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const body = JSON.parse(event.body ?? '{}') as {
      inventory: Record<string, number>;
      consumptionRates: Record<string, { unitsPerHour: number; sampleCount: number }>;
    };

    const useCase = new AnalyzeInventoryUseCase(new OpenAIAdapter());
    const result = await useCase.execute(body);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
};
