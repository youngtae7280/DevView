import type { LlmProvider } from '../../../providers/llm/types'
import type {
  GenerateAcePackInput,
  AutonomousCodexExecutionPack,
} from '../acep/acep-types'
import type {
  GenerateAcceptancePlanInput,
  GenerateLeafVerificationDesignInput,
  SynthesizeParentVerificationDesignInput,
  AcceptancePlan,
  VerificationDesign,
} from '../vd/vd-types'
import type {
  GenerateImplementationRoadmapInput,
  GenerateLeafWorkDesignInput,
  SynthesizeParentWorkDesignInput,
  ImplementationRoadmap,
  WorkDesign,
} from '../wpd/wpd-types'

export interface PbeLlmProvider extends LlmProvider {
  generateLeafWorkDesign(input: GenerateLeafWorkDesignInput): Promise<WorkDesign>
  synthesizeParentWorkDesign(
    input: SynthesizeParentWorkDesignInput,
  ): Promise<WorkDesign>
  generateImplementationRoadmap(
    input: GenerateImplementationRoadmapInput,
  ): Promise<ImplementationRoadmap>
  generateLeafVerificationDesign(
    input: GenerateLeafVerificationDesignInput,
  ): Promise<VerificationDesign>
  synthesizeParentVerificationDesign(
    input: SynthesizeParentVerificationDesignInput,
  ): Promise<VerificationDesign>
  generateAcceptancePlan(input: GenerateAcceptancePlanInput): Promise<AcceptancePlan>
  generateAutonomousCodexExecutionPack(
    input: GenerateAcePackInput,
  ): Promise<AutonomousCodexExecutionPack>
}
