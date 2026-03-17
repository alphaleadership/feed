# Implementation Plan: NSFW Detection System

## Overview

This implementation plan breaks down the NSFW Detection System into discrete, actionable coding tasks. The system will replace the hardcoded term matching in `resort-breaches.js` with a sophisticated, configurable detection engine featuring confidence scoring, context-aware analysis, and extensible detection rules.

The implementation follows a modular approach: first establishing core infrastructure and data structures, then implementing detection algorithms, followed by integration and comprehensive testing.

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - Create the `scripts/nsfw-detector/` directory structure
  - Create `scripts/nsfw-detector/index.js` as the main entry point
  - Define TypeScript-like JSDoc interfaces for all major classes and data structures
  - Set up logging utility with configurable levels (error, warn, info, debug)
  - _Requirements: 5.1, 5.2, 10.1_

- [ ] 2. Implement TermDictionary class
  - [ ] 2.1 Create TermDictionary class with term loading and retrieval methods
    - Implement constructor to load terms from JSON file
    - Implement `getTerm(word)` method to retrieve term definitions
    - Implement `getCategory(categoryName)` method to retrieve all terms in a category
    - Implement `getAllTerms()` method to return all terms across categories
    - Add error handling for missing or invalid term files
    - _Requirements: 1.1, 1.2, 1.3, 5.2_

  - [ ]* 2.2 Write property test for term dictionary loading
    - **Property 14: External Configuration Loading**
    - **Validates: Requirements 5.2**

- [ ] 3. Implement PatternMatcher class
  - [ ] 3.1 Create PatternMatcher class with text normalization and matching
    - Implement `normalizeText(text)` method (lowercase, whitespace, punctuation, accents)
    - Implement `findMatches(text, terms, options)` method for word boundary matching
    - Implement regex pattern caching to avoid recompilation
    - Support both exact phrase matching and word boundary matching
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.3, 7.4_

  - [ ]* 3.2 Write property test for pattern matching
    - **Property 10: Case-Insensitive Matching**
    - **Validates: Requirements 4.1**

  - [ ]* 3.3 Write property test for word boundary matching
    - **Property 13: Word Boundary Matching**
    - **Validates: Requirements 4.4**

- [ ] 4. Implement ContextAnalyzer class
  - [ ] 4.1 Create ContextAnalyzer class with context window analysis
    - Implement `analyzeContext(text, termPosition, windowSize)` method
    - Detect negation words (not, no, without, never, avoid, prevent)
    - Extract context window (±5 words by default)
    - Classify context type (NSFW, non-NSFW, neutral)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write property test for negation detection
    - **Property 9: Negation Reduces Confidence**
    - **Validates: Requirements 3.3_

  - [ ]* 4.3 Write property test for context analysis
    - **Property 8: Non-NSFW Context Reduces Confidence**
    - **Validates: Requirements 3.2**

- [ ] 5. Implement ConfidenceScorer class
  - [ ] 5.1 Create ConfidenceScorer class with scoring algorithm
    - Implement `calculateScore(matches, text, config)` method
    - Apply base confidence from term definitions
    - Apply context modifiers (negation, non-NSFW context)
    - Apply proximity multiplier for multiple terms within window
    - Clamp final score to [0, 1]
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 5.2 Write property test for confidence score range
    - **Property 3: Confidence Score Range**
    - **Validates: Requirements 2.1**

  - [ ]* 5.3 Write property test for single term confidence
    - **Property 4: Single Term Confidence**
    - **Validates: Requirements 2.2**

  - [ ]* 5.4 Write property test for multiple terms increase confidence
    - **Property 5: Multiple Terms Increase Confidence**
    - **Validates: Requirements 2.3**

  - [ ]* 5.5 Write property test for proximity multiplier
    - **Property 6: Proximity Multiplier Application**
    - **Validates: Requirements 2.4**

  - [ ]* 5.6 Write property test for threshold-based classification
    - **Property 7: Threshold-Based Classification**
    - **Validates: Requirements 2.5**

- [ ] 6. Implement NSFWDetector main class
  - [ ] 6.1 Create NSFWDetector class with core analysis pipeline
    - Implement constructor to initialize all components (TermDictionary, PatternMatcher, ContextAnalyzer, ConfidenceScorer)
    - Load configuration from JSON file with defaults
    - Implement `analyze(text)` method orchestrating the full detection pipeline
    - Return AnalysisResult with isNSFW, confidence, detectedTerms, reasoning, and details
    - Implement error handling for null/undefined inputs
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 5.2, 6.1, 6.2, 6.3, 6.5_

  - [ ]* 6.2 Write property test for term variations detection
    - **Property 1: Term Variations Detection**
    - **Validates: Requirements 1.2**

  - [ ]* 6.3 Write property test for synonym detection
    - **Property 2: Synonym Detection**
    - **Validates: Requirements 1.3**

  - [ ]* 6.4 Write property test for edge case handling
    - **Property 22: Edge Case Handling**
    - **Validates: Requirements 9.3**

  - [ ]* 6.5 Write property test for score consistency
    - **Property 23: Score Consistency**
    - **Validates: Requirements 9.4**

- [ ] 7. Implement configuration management
  - [ ] 7.1 Create ConfigurationManager class
    - Implement `loadConfiguration(configPath)` method
    - Validate configuration structure and required fields
    - Provide sensible defaults for missing values
    - Implement `updateConfiguration(newConfig)` method for runtime updates
    - Add logging for configuration loading and validation
    - _Requirements: 5.1, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 7.2 Write unit tests for configuration loading
    - Test loading valid configuration files
    - Test handling of missing configuration files
    - Test default value application
    - _Requirements: 8.1_

- [ ] 8. Create configuration and term dictionary files
  - [ ] 8.1 Create `.kiro/specs/nsfw-detection-system/config.json`
    - Define detector settings (thresholds, window sizes, multipliers)
    - Define enabled/disabled categories
    - Define logging configuration
    - _Requirements: 5.2, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 8.2 Create `.kiro/specs/nsfw-detection-system/terms.json`
    - Define at least 50 NSFW terms across multiple categories
    - Include variations and synonyms for each term
    - Include context modifiers for each term
    - Organize by category (adult_content, dating_services, escort_services, etc.)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9. Implement additional detector methods
  - [ ] 9.1 Implement `analyzeBatch(texts)` method
    - Process multiple descriptions efficiently
    - Return array of AnalysisResult objects
    - _Requirements: 7.2_

  - [ ] 9.2 Implement `addCustomRule(ruleName, ruleFn)` method
    - Allow registration of custom detection functions
    - Integrate custom rules into analysis pipeline
    - _Requirements: 5.3_

  - [ ] 9.3 Implement `getStatistics()` method
    - Track total analyzed, average confidence, detection rate
    - Return statistics object for monitoring
    - _Requirements: 5.4_

- [ ] 10. Implement integration with resort-breaches.js
  - [x] 10.1 Modify `scripts/resort-breaches.js` to use NSFWDetector
    - Replace hardcoded NSFW term matching with detector instance
    - Initialize detector once at script start
    - Call detector.analyze() for each breach with Description
    - Set breach.isNSFW and breach.nsfwConfidence properties
    - Implement error handling to continue on detector errors
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 10.2 Write integration tests for resort-breaches.js
    - Test detector initialization
    - Test breach processing with detector
    - Test error handling and recovery
    - _Requirements: 6.4, 6.5_

- [ ] 11. Checkpoint - Ensure all core components pass tests
  - Verify all unit tests pass for core classes
  - Verify all property tests pass for correctness properties
  - Verify integration with resort-breaches.js works correctly
  - Ask the user if questions arise.

- [ ] 12. Implement comprehensive unit tests
  - [ ] 12.1 Write unit tests for TermDictionary
    - Test term loading from JSON
    - Test term retrieval by name
    - Test category retrieval
    - Test handling of missing terms
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 12.2 Write unit tests for PatternMatcher
    - Test exact word boundary matching
    - Test case-insensitive matching
    - Test partial word rejection
    - Test normalization (whitespace, punctuation, accents)
    - Test phrase matching
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 12.3 Write unit tests for ContextAnalyzer
    - Test negation detection
    - Test context window extraction
    - Test context classification
    - Test context modifier application
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 12.4 Write unit tests for ConfidenceScorer
    - Test base score assignment
    - Test proximity multiplier application
    - Test context reduction
    - Test negation reduction
    - Test score clamping to [0, 1]
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 12.5 Write unit tests for NSFWDetector
    - Test full analysis pipeline
    - Test error handling for null/undefined inputs
    - Test configuration loading
    - Test batch processing
    - Test custom rule registration
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.5_

  - [ ] 12.6 Write unit tests for edge cases
    - Test empty string input
    - Test null/undefined input
    - Test special characters
    - Test very long text (10,000+ characters)
    - Test mixed case variations
    - _Requirements: 9.3_

- [ ] 13. Implement property-based tests for all correctness properties
  - [ ] 13.1 Write property tests for normalization and matching
    - **Property 10: Case-Insensitive Matching**
    - **Property 11: Whitespace and Punctuation Normalization**
    - **Property 12: Accent Normalization**
    - **Property 13: Word Boundary Matching**
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 13.2 Write property tests for confidence scoring
    - **Property 3: Confidence Score Range**
    - **Property 4: Single Term Confidence**
    - **Property 5: Multiple Terms Increase Confidence**
    - **Property 6: Proximity Multiplier Application**
    - **Property 7: Threshold-Based Classification**
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 13.3 Write property tests for context analysis
    - **Property 8: Non-NSFW Context Reduces Confidence**
    - **Property 9: Negation Reduces Confidence**
    - _Requirements: 3.2, 3.3_

  - [ ] 13.4 Write property tests for term detection
    - **Property 1: Term Variations Detection**
    - **Property 2: Synonym Detection**
    - _Requirements: 1.2, 1.3_

  - [ ] 13.5 Write property tests for configuration and integration
    - **Property 14: External Configuration Loading**
    - **Property 15: Breach Object Property Setting**
    - **Property 16: Error Graceful Handling**
    - **Property 19: Configurable Threshold Application**
    - **Property 20: Category Filtering**
    - **Property 21: Context Analysis Toggle**
    - _Requirements: 5.2, 6.2, 6.3, 6.5, 8.2, 8.3, 8.4_

  - [ ] 13.6 Write property tests for performance and consistency
    - **Property 17: Single Description Performance**
    - **Property 18: Batch Processing Performance**
    - **Property 22: Edge Case Handling**
    - **Property 23: Score Consistency**
    - _Requirements: 7.1, 7.2, 9.3, 9.4_

- [ ] 14. Implement performance optimization
  - [ ] 14.1 Optimize pattern matching with caching
    - Verify regex patterns are compiled once and cached
    - Implement early exit when confidence threshold exceeded
    - _Requirements: 7.3, 7.4_

  - [ ] 14.2 Implement lazy context analysis
    - Only analyze context for borderline confidence scores (0.4-0.7)
    - Skip context analysis for high/low confidence terms
    - _Requirements: 7.1, 7.2_

  - [ ] 14.3 Verify performance targets
    - Verify single description analysis completes within 10ms
    - Verify batch processing of 1000 descriptions completes within 5 seconds
    - _Requirements: 7.1, 7.2_

- [ ] 15. Implement logging and debugging
  - [ ] 15.1 Add comprehensive logging throughout detector
    - Log detector initialization and configuration loading
    - Log detected terms and confidence calculations
    - Log context analysis decisions
    - Log errors and warnings
    - _Requirements: 5.4, 10.1_

  - [ ] 15.2 Implement debug mode
    - Add debug flag to configuration
    - Log detailed analysis steps when debug enabled
    - Include scoring breakdown in results
    - _Requirements: 5.4_

- [ ] 16. Create documentation
  - [ ] 16.1 Create README.md for NSFW Detection System
    - Document system overview and architecture
    - Document configuration options and usage
    - Document term dictionary structure
    - Include examples of detection results
    - Document known limitations and false positive/negative scenarios
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 16.2 Add inline code comments
    - Document all public methods with JSDoc comments
    - Explain complex algorithms and scoring logic
    - Document error handling and edge cases
    - _Requirements: 10.1_

  - [ ] 16.3 Create usage examples
    - Basic usage example
    - Batch processing example
    - Custom configuration example
    - Custom rule registration example
    - _Requirements: 10.4_

- [ ] 17. Final checkpoint - Ensure all tests pass and integration complete
  - Verify all unit tests pass (>90% code coverage)
  - Verify all property tests pass (all 23 properties)
  - Verify integration with resort-breaches.js works end-to-end
  - Verify performance targets met (<10ms per description, <5s for 1000)
  - Verify documentation is complete and accurate
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across many generated inputs
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and early error detection
- All code should follow existing project conventions and style
- Configuration and term dictionary files are JSON for easy maintenance and extensibility
