# NSFW Detection System Requirements

## Introduction

The current NSFW detection system in `scripts/resort-breaches.js` uses a hardcoded array of terms with basic substring matching. This approach has limited detection capability, poor maintainability, and no confidence scoring. This requirements document defines an improved NSFW detection system that provides better accuracy, supports term variations and synonyms, includes confidence scoring, and enables future extensibility.

The system will analyze breach descriptions to identify potentially sensitive or adult-oriented content and flag them appropriately for content filtering and user warnings.

## Glossary

- **NSFW_Detector**: The component responsible for analyzing text and determining if content is NSFW
- **Breach**: A data breach record containing metadata including a description field
- **Description**: The text field in a breach record that describes the nature and scope of the breach
- **Term_Variation**: Alternative forms of a word (e.g., plurals, verb conjugations, common misspellings)
- **Synonym**: A word with similar meaning to another word
- **Confidence_Score**: A numerical value (0-1) indicating the likelihood that content is NSFW
- **Detection_Rule**: A pattern or condition used to identify NSFW content
- **Context_Window**: The surrounding text used to determine if a term is used in an NSFW context
- **False_Positive**: Incorrectly flagging non-NSFW content as NSFW
- **False_Negative**: Failing to flag NSFW content

## Requirements

### Requirement 1: Comprehensive Term Dictionary with Variations

**User Story:** As a content moderator, I want the system to recognize NSFW terms and their variations, so that I can reliably identify adult-oriented breaches.

#### Acceptance Criteria

1. THE NSFW_Detector SHALL maintain a dictionary of NSFW terms organized by category (adult content, dating services, escort services, etc.)
2. WHEN analyzing text, THE NSFW_Detector SHALL recognize base terms and their common variations (plurals, verb forms, common misspellings)
3. WHERE a term has known synonyms, THE NSFW_Detector SHALL include those synonyms in detection
4. THE NSFW_Detector SHALL support at least 50 distinct NSFW terms across multiple categories
5. WHEN a new term needs to be added, THE NSFW_Detector SHALL allow adding it without modifying core detection logic

### Requirement 2: Confidence Scoring System

**User Story:** As a system administrator, I want confidence scores for NSFW detection, so that I can distinguish between certain and uncertain classifications.

#### Acceptance Criteria

1. WHEN analyzing a breach description, THE NSFW_Detector SHALL return a confidence score between 0 and 1
2. WHEN a single NSFW term is found, THE NSFW_Detector SHALL assign a base confidence score reflecting the term's reliability
3. WHEN multiple NSFW terms are found in the same description, THE NSFW_Detector SHALL increase the confidence score
4. WHEN NSFW terms appear in close proximity (within 10 words), THE NSFW_Detector SHALL apply a multiplier to increase confidence
5. THE NSFW_Detector SHALL return a final isNSFW boolean based on a configurable confidence threshold (default: 0.5)

### Requirement 3: Context-Aware Detection

**User Story:** As a content analyst, I want the system to understand context, so that it avoids false positives from legitimate uses of sensitive terms.

#### Acceptance Criteria

1. WHEN analyzing text, THE NSFW_Detector SHALL examine a context window of surrounding words (±5 words) around detected terms
2. IF a term appears in a clearly non-NSFW context (e.g., "sex education", "dating app security"), THE NSFW_Detector SHALL reduce the confidence score
3. WHEN a term is preceded by negation words (e.g., "not", "no", "without"), THE NSFW_Detector SHALL reduce the confidence score
4. THE NSFW_Detector SHALL maintain a list of context modifiers that affect confidence scoring

### Requirement 4: Improved Detection Accuracy

**User Story:** As a data analyst, I want better detection accuracy, so that I can trust the NSFW classification results.

#### Acceptance Criteria

1. WHEN analyzing a description, THE NSFW_Detector SHALL use case-insensitive matching
2. WHEN analyzing a description, THE NSFW_Detector SHALL normalize whitespace and punctuation before matching
3. WHEN a term contains special characters or accents, THE NSFW_Detector SHALL normalize them for matching
4. WHEN analyzing text, THE NSFW_Detector SHALL avoid matching partial words (e.g., "sex" should not match "sexuality" unless explicitly configured)
5. THE NSFW_Detector SHALL support both exact phrase matching and word boundary matching

### Requirement 5: Maintainability and Extensibility

**User Story:** As a developer, I want a maintainable and extensible system, so that I can easily update detection rules and add new capabilities.

#### Acceptance Criteria

1. THE NSFW_Detector SHALL separate term definitions from detection logic
2. THE NSFW_Detector SHALL load term definitions from an external configuration file (JSON format)
3. WHERE new detection rules are needed, THE NSFW_Detector SHALL support adding custom detection functions without modifying core logic
4. THE NSFW_Detector SHALL provide clear logging of detection decisions for debugging
5. THE NSFW_Detector SHALL include comprehensive documentation of all configuration options

### Requirement 6: Integration with Breach Processing

**User Story:** As a system operator, I want the improved detector to integrate seamlessly with the existing breach processing workflow, so that all breaches are classified consistently.

#### Acceptance Criteria

1. WHEN processing a breach, THE NSFW_Detector SHALL analyze the Description field
2. WHEN a breach is processed, THE NSFW_Detector SHALL set the isNSFW boolean property on the breach object
3. WHERE a confidence score is available, THE NSFW_Detector SHALL also set an nsfwConfidence property on the breach object
4. WHEN the breach processing script runs, THE NSFW_Detector SHALL be called for each breach with a Description
5. IF the NSFW_Detector encounters an error, THE breach processing script SHALL continue with isNSFW set to false and log the error

### Requirement 7: Performance Requirements

**User Story:** As a system administrator, I want the detection system to perform efficiently, so that breach processing completes in reasonable time.

#### Acceptance Criteria

1. WHEN analyzing a single breach description, THE NSFW_Detector SHALL complete analysis within 10ms
2. WHEN processing 1000 breaches, THE NSFW_Detector SHALL complete all analyses within 5 seconds
3. THE NSFW_Detector SHALL use efficient string matching algorithms (e.g., regex or trie-based matching)
4. THE NSFW_Detector SHALL cache compiled patterns to avoid recompilation on each analysis

### Requirement 8: Configuration and Customization

**User Story:** As a system administrator, I want to customize detection behavior, so that I can adjust sensitivity and add organization-specific rules.

#### Acceptance Criteria

1. THE NSFW_Detector SHALL support a configuration object with adjustable parameters
2. WHERE a confidence threshold is specified, THE NSFW_Detector SHALL use it to determine the final isNSFW classification
3. WHERE term categories are specified, THE NSFW_Detector SHALL only detect terms from those categories
4. THE NSFW_Detector SHALL support enabling/disabling context-aware detection
5. THE NSFW_Detector SHALL support enabling/disabling specific detection rules

### Requirement 9: Testing and Validation

**User Story:** As a QA engineer, I want comprehensive test coverage, so that I can verify detection accuracy and prevent regressions.

#### Acceptance Criteria

1. WHEN test cases are provided, THE NSFW_Detector SHALL correctly classify known NSFW descriptions
2. WHEN test cases are provided, THE NSFW_Detector SHALL correctly classify known non-NSFW descriptions
3. WHEN edge cases are tested, THE NSFW_Detector SHALL handle empty strings, null values, and special characters
4. WHEN confidence scores are tested, THE NSFW_Detector SHALL produce consistent scores for identical inputs
5. THE NSFW_Detector SHALL include test cases for false positive and false negative scenarios

### Requirement 10: Documentation and Maintenance

**User Story:** As a developer, I want clear documentation, so that I can understand and maintain the system.

#### Acceptance Criteria

1. THE NSFW_Detector SHALL include inline code comments explaining detection logic
2. THE NSFW_Detector SHALL provide a README documenting configuration options and usage
3. THE NSFW_Detector SHALL document the term dictionary structure and how to add new terms
4. THE NSFW_Detector SHALL include examples of detection results with explanations
5. THE NSFW_Detector SHALL document known limitations and false positive/negative scenarios

