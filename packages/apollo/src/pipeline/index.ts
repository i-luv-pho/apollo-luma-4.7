/**
 * Slide Generation Pipeline
 *
 * 7-Step orchestration for generating HTML presentation slides:
 * 1. UNDERSTAND - Parse user request, extract context
 * 2. RESEARCH - Gather facts and data (no placeholders!)
 * 3. OUTLINE - Generate headlines that tell a story
 * 4. DESIGN - Select layouts and typography
 * 5. BUILD - Generate HTML for each slide
 * 6. VERIFY - Validate quality, no placeholders
 * 7. DELIVER - Output final presentation
 */

export { SlidePipeline } from "./slide-pipeline"
export { PipelineValidators } from "./validators"
export * from "./steps"
