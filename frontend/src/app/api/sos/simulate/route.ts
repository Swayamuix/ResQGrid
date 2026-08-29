import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';

const SIMULATION_PRESETS = [
  {
    location: 'Geeta Colony Ring Road Sector 5',
    message: 'Water breached ground floor shops. 6 store workers and 2 customers trapped on mezzanine loft. Need immediate evacuation boat.',
    citizen: 'Vikas Malhotra',
    needs: ['Power Loss', 'Elderly Merchant (70yo)', 'Medical Kit'],
    lat: 28.6495,
    lng: 77.2680,
    depth: 4.2,
    count: 8,
  },
  {
    location: 'Shakarpur Pushta Lowland Lane 3',
    message: 'Embankment overflowed. 4 residents trapped on single-story roof. Current is strong, cannot swim across.',
    citizen: 'Pooja Devi',
    needs: ['Pregnant Mother', 'Food/Water Ration', 'Infant Care'],
    lat: 28.6255,
    lng: 77.2820,
    depth: 5.1,
    count: 4,
  },
  {
    location: 'Okhla Village Embankment Zone 2',
    message: 'Sewage backflow merged with flood water. 8 people isolated on residential second floor.',
    citizen: 'Mohammad Tariq',
    needs: ['Potable Drinking Water', 'Elderly Evacuation', 'Insulin Cooling'],
    lat: 28.5630,
    lng: 77.2940,
    depth: 3.6,
    count: 8,
  },
  {
    location: 'Bela Road Ghat Civil Lines',
    message: 'Monastery basement submerged. 7 monks and caretaker moved to pagoda top.',
    citizen: 'Tenzin Dorjee',
    needs: ['First Aid', 'Hypothermia Risk'],
    lat: 28.6780,
    lng: 77.2280,
    depth: 4.6,
    count: 7,
  },
  {
    location: 'Kalyanpuri Culvert Bypass',
    message: 'Auto rickshaw stranded in culvert whirlpool with 3 passengers. Water rising fast.',
    citizen: 'Deepak Kumar',
    needs: ['Submerged Vehicle', 'Urgent Rope Retrieval'],
    lat: 28.6180,
    lng: 77.3150,
    depth: 3.4,
    count: 3,
  },
];

export async function POST() {
  try {
    const preset = SIMULATION_PRESETS[Math.floor(Math.random() * SIMULATION_PRESETS.length)];
    const randPhone = `+91-98765-XX${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await orchestrator.runPipeline({
      rawText: preset.message,
      locationName: preset.location,
      citizenName: preset.citizen,
      phone: randPhone,
      trappedCount: preset.count,
      waterDepthFt: preset.depth,
      specialNeeds: preset.needs,
      lat: preset.lat + (Math.random() - 0.5) * 0.004,
      lng: preset.lng + (Math.random() - 0.5) * 0.004,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error in /api/sos/simulate:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Simulation Error' },
      { status: 500 }
    );
  }
}
