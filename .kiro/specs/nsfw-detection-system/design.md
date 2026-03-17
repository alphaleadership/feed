# NSFW Detection System - Design Document

## Overview

The NSFW Detection System is a modular component designed to analyze breach descriptions and identify potentially sensitive or adult-oriented content. It replaces the hardcoded term matching in `resort-breaches.js` with a sophisticated, configurable detection engine that provides confidence scoring, context-aware analysis, and extensible detection rules.

### Key Design Goals

- **Accuracy**: Minimize false positives and false negatives through context-aware detection
- **Maintainability**: Separate term definitions from detection logic via external configuration
- **Performance**: Analyze descriptions in <10ms per breach with efficient string matching
- **Extensibility**: Support custom detection rules and new term categories without core logic changes
- **Transparency**: Provide confidence scores and detailed logging for debugging

### System Scope

The detector analyzes the `Description` field of breach records and sets two properties:
- `isNSFW`: Boolean indicating if content is classified as NSFW
- `nsfwConfidence`: Numerical score (0-1) indicating detection confidence

---

## Architecture

### Component Structure

```
NSFWDetectionSystem
├── NSFWDetector (main class)
│   ├── TermDictionary (manages term definitions)
│   ├── ConfidenceScorer (calculates confidence scores)
│   ├── ContextAnalyzer (evaluates surrounding context)
│   ├── PatternMatcher (performs string matching)
│   └── ConfigurationManager (handles settings)
├── Configuration (external JSON file)
└── Logging (debug and error tracking)
```

### Data Flow

```
Breach Description
    ↓
[Normalization: lowercase, whitespace, punctuation]
    ↓
[Pattern Matching: find NSFW terms]
    ↓
[Context Analysis: evaluate surrounding words]
    ↓
[Confidence Scoring: calculate final score]
    ↓
[Threshold Check: determine isNSFW boolean]
    ↓
Result: { isNSFW, nsfwConfidence, detectedTerms, reasoning }
```

### Integration with resort-breaches.js

The detector integrates as a utility module:

```javascript
const NSFWDetector = require('./nsfw-detector');
const detector = new NSFWDetector(configPath);

// In the breach processing loop:
db.breaches.forEach((breach) => {
  const result = detector.analyze(breach.Description);
  breach.isNSFW = result.isNSFW;
  breach.nsfwConfidence = result.confidence;
});
```

---

## Components and Interfaces

### NSFWDetector Class

**Constructor**
```javascript
new NSFWDetector(configPath, options)
```
- `configPath`: Path to configuration JSON file
- `options`: Optional overrides for configuration

**Public Methods**

```javascript
analyze(text) → {
  isNSFW: boolean,
  confidence: number (0-1),
  detectedTerms: string[],
  reasoning: string,
  matches: Array<{term, category, confidence, context}>
}
```

Analyzes a text string and returns detection results.

```javascript
updateConfiguration(newConfig) → void
```

Updates detector configuration at runtime.

```javascript
addCustomRule(ruleName, ruleFn) → void
```

Registers a custom detection function.

### TermDictionary Class

**Structure**
```javascript
{
  categories: {
    "adult_content": {
      baseConfidence: 0.9,
      terms: [
        {
          term: "porn",
          variations: ["porno", "pornography", "pornographic"],
          synonyms: ["adult", "xxx"],
          contextModifiers: ["education", "industry"]
        }
      ]
    }
  }
}
```

**Methods**

```javascript
getTerm(word) → TermDefinition | null
```

Retrieves term definition including variations and synonyms.

```javascript
getCategory(categoryName) → Category | null
```

Retrieves all terms in a category.

```javascript
getAllTerms() → Term[]
```

Returns all terms across all categories.

### ConfidenceScorer Class

**Scoring Algorithm**

1. **Base Score**: Start with term's base confidence (0.5-0.95)
2. **Proximity Multiplier**: Increase if multiple terms within 10 words (×1.2-1.5)
3. **Context Reduction**: Decrease if in non-NSFW context (×0.3-0.7)
4. **Negation Reduction**: Decrease if preceded by negation (×0.4)
5. **Final Score**: Clamp to [0, 1]

**Methods**

```javascript
calculateScore(matches, text, config) → number
```

Calculates final confidence score from detected matches.

```javascript
applyContextModifier(baseScore, context) → number
```

Adjusts score based on surrounding context.

### ContextAnalyzer Class

**Context Window**: ±5 words around detected term

**Non-NSFW Contexts**
- "sex education", "dating app", "escort service security"
- "adult industry", "adult content", "adult website"

**Negation Words**
- "not", "no", "without", "never", "avoid", "prevent"

**Methods**

```javascript
analyzeContext(text, termPosition, windowSize) → {
  hasNegation: boolean,
  contextWords: string[],
  contextType: string
}
```

Analyzes surrounding context of a detected term.

### PatternMatcher Class

**Matching Strategies**

1. **Word Boundary Matching**: Match whole words only (default)
2. **Phrase Matching**: Match exact phrases
3. **Fuzzy Matching**: Match with character tolerance (optional)

**Normalization**
- Convert to lowercase
- Remove accents and diacritics
- Normalize whitespace
- Remove punctuation (except within phrases)

**Methods**

```javascript
findMatches(text, terms, options) → Match[]
```

Finds all term matches in text with positions.

```javascript
normalizeText(text) → string
```

Normalizes text for consistent matching.

---

## Data Models

### Configuration File Structure

**File**: `.kiro/specs/nsfw-detection-system/config.json`

```json
{
  "detector": {
    "confidenceThreshold": 0.5,
    "contextWindowSize": 5,
    "enableContextAnalysis": true,
    "enableNegationHandling": true,
    "enableFuzzyMatching": false,
    "fuzzyMatchThreshold": 0.85,
    "proximityWindow": 10,
    "proximityMultiplier": 1.3
  },
  "categories": {
    "enabled": ["adult_content", "dating_services", "escort_services"],
    "disabled": []
  },
  "logging": {
    "enabled": true,
    "level": "info",
    "logDetectedTerms": true,
    "logConfidenceScores": true
  },
  "customRules": {
    "enabled": false,
    "rules": []
  }
}
```

### Term Dictionary Structure

**File**: `.kiro/specs/nsfw-detection-system/terms.json`

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-01T00:00:00Z",
  "categories": {
    "adult_content": {
      "name": "Adult Content",
      "description": "Terms related to adult/pornographic content",
      "baseConfidence": 0.9,
      "terms": [
        {
          "id": "porn_001",
          "term": "porn",
          "variations": ["porno", "pornography", "pornographic", "porn"],
          "synonyms": ["adult", "xxx"],
          "contextModifiers": {
            "reduce": ["education", "industry", "website"],
            "increase": []
          },
          "notes": "High confidence indicator"
        }
      ]
    },
    "dating_services": {
      "name": "Dating Services",
      "description": "Terms related to dating platforms",
      "baseConfidence": 0.6,
      "terms": [
        {
          "id": "dating_001",
          "term": "dating",
          "variations": ["date", "dating app", "dating site"],
          "synonyms": ["matchmaking"],
          "contextModifiers": {
            "reduce": ["app security", "platform"],
            "increase": []
          },
          "notes": "Lower confidence, requires context"
        }
      ]
    }
  }
}
```

### Breach Object Extension

```javascript
{
  // ... existing breach properties
  "Description": "string",
  "isNSFW": boolean,
  "nsfwConfidence": number,
  "nsfwDetails": {
    "detectedTerms": string[],
    "matchCount": number,
    "reasoning": string,
    "matches": [
      {
        "term": "string",
        "category": "string",
        "confidence": number,
        "position": number,
        "context": "string"
      }
    ]
  }
}
```

---

## Detection Algorithms and Scoring Logic

### Algorithm 1: Term Matching

**Input**: Text, term dictionary
**Output**: Array of matches with positions

```
1. Normalize input text
2. For each category in enabled categories:
   a. For each term in category:
      i. Find all occurrences (word boundary matching)
      ii. For each variation and synonym:
          - Find all occurrences
      iii. Record match with position and term metadata
3. Return sorted matches by position
```

**Complexity**: O(n*m) where n = text length, m = total terms

### Algorithm 2: Confidence Scoring

**Input**: Matches, text, configuration
**Output**: Confidence score (0-1)

```
1. If no matches found: return 0.0
2. Initialize baseScore = 0.0
3. For each match:
   a. Get term's base confidence
   b. Apply context analysis:
      - If negation found: multiply by 0.4
      - If non-NSFW context: multiply by 0.5
   c. Add to baseScore (average)
4. Apply proximity multiplier:
   - If 2+ matches within proximityWindow: multiply by 1.3
   - If 3+ matches: multiply by 1.5
5. Clamp score to [0, 1]
6. Return final score
```

**Example Calculation**:
- Single "porn" term: 0.9 (base) = 0.9
- "porn" + "adult" within 10 words: (0.9 + 0.8) / 2 × 1.3 = 1.1 → clamped to 1.0
- "not porn": 0.9 × 0.4 = 0.36
- "porn education": 0.9 × 0.5 = 0.45

### Algorithm 3: Context Analysis

**Input**: Text, term position, window size
**Output**: Context metadata

```
1. Extract words ±windowSize around term
2. Check for negation words in window
3. Check for context modifier words
4. Classify context type (NSFW, non-NSFW, neutral)
5. Return context analysis
```

---

## Context-Aware Detection Mechanisms

### Context Modifiers

**Non-NSFW Contexts** (reduce confidence by 50%)
- "sex education", "dating app security", "escort service breach"
- "adult industry", "adult website", "adult content platform"
- "dating platform", "dating service", "dating site"

**Negation Handling** (reduce confidence by 60%)
- Negation words: "not", "no", "without", "never", "avoid", "prevent"
- Example: "no adult content" → confidence reduced

**Proximity Boost** (increase confidence by 30-50%)
- Multiple NSFW terms within 10 words
- Example: "porn and adult content" → confidence increased

### Context Window Analysis

```javascript
function analyzeContext(text, termPosition, windowSize = 5) {
  const words = text.split(/\s+/);
  const termWordIndex = getWordIndex(text, termPosition);
  
  const startIdx = Math.max(0, termWordIndex - windowSize);
  const endIdx = Math.min(words.length, termWordIndex + windowSize + 1);
  
  const contextWords = words.slice(startIdx, endIdx);
  const contextText = contextWords.join(' ');
  
  return {
    hasNegation: /\b(not|no|without|never|avoid|prevent)\b/i.test(contextText),
    contextWords: contextWords,
    contextType: classifyContext(contextText)
  };
}
```

---

## Integration Points with resort-breaches.js

### Integration Location

In `resort-breaches.js`, replace the current NSFW detection block:

```javascript
// OLD CODE (lines ~130-135):
if (!Object.keys(breach).includes("isNSFW")) {
  breach.isNSFW = false;
  if (breach.Description) {
    const descLower = breach.Description.toLowerCase();
    breach.isNSFW = nsfwTerms.some(term => descLower.includes(term.toLowerCase()));
  }
}

// NEW CODE:
const NSFWDetector = require('./nsfw-detector');
const detector = new NSFWDetector(configPath);

if (!Object.keys(breach).includes("isNSFW")) {
  try {
    const result = detector.analyze(breach.Description || '');
    breach.isNSFW = result.isNSFW;
    breach.nsfwConfidence = result.confidence;
    if (config.logging.enabled) {
      breach.nsfwDetails = result.details;
    }
  } catch (error) {
    console.error(`NSFW detection error for breach ${breach.Name}:`, error);
    breach.isNSFW = false;
    breach.nsfwConfidence = 0;
  }
}
```

### Error Handling

- If detector initialization fails: log error, continue with isNSFW = false
- If analysis throws: catch error, log, set isNSFW = false
- If config file missing: use defaults, log warning

### Performance Considerations

- Initialize detector once at script start
- Cache compiled regex patterns
- Use efficient string matching (avoid repeated regex compilation)
- Process breaches sequentially (no parallelization needed for <10ms per item)

---

## Performance Optimization Strategies

### 1. Pattern Caching

Compile regex patterns once during initialization:

```javascript
class PatternMatcher {
  constructor(terms) {
    this.patterns = new Map();
    this.compilePatterns(terms);
  }
  
  compilePatterns(terms) {
    terms.forEach(term => {
      const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
      this.patterns.set(term, pattern);
    });
  }
}
```

### 2. Trie-Based Matching (Optional)

For large term dictionaries (>500 terms), use a trie structure:

```javascript
class TrieMatcher {
  constructor(terms) {
    this.trie = this.buildTrie(terms);
  }
  
  buildTrie(terms) {
    // Build trie structure for O(n) matching
  }
  
  findMatches(text) {
    // Traverse trie for efficient matching
  }
}
```

### 3. Early Exit

Stop analysis if confidence threshold exceeded:

```javascript
if (currentScore >= 1.0) {
  return { isNSFW: true, confidence: 1.0 };
}
```

### 4. Lazy Context Analysis

Only analyze context if term confidence is borderline (0.4-0.7):

```javascript
if (termConfidence > 0.7) {
  // High confidence, skip context analysis
  return termConfidence;
} else if (termConfidence < 0.4) {
  // Low confidence, skip context analysis
  return termConfidence;
} else {
  // Borderline, analyze context
  return applyContextModifier(termConfidence, context);
}
```

### 5. Batch Processing

For processing multiple breaches:

```javascript
const results = detector.analyzeBatch(breaches.map(b => b.Description));
breaches.forEach((breach, idx) => {
  breach.isNSFW = results[idx].isNSFW;
  breach.nsfwConfidence = results[idx].confidence;
});
```

### Performance Targets

- Single description: <10ms
- 1000 breaches: <5 seconds (5ms average)
- Memory: <50MB for detector + term dictionary

---

## Error Handling and Logging

### Error Categories

1. **Configuration Errors**
   - Missing config file → use defaults, log warning
   - Invalid JSON → throw error, halt initialization
   - Missing required fields → use defaults, log warning

2. **Runtime Errors**
   - Null/undefined input → return { isNSFW: false, confidence: 0 }
   - Regex compilation failure → log error, skip term
   - Context analysis failure → skip context, use base score

3. **Integration Errors**
   - Detector initialization fails → log error, continue with isNSFW = false
   - Analysis throws → catch, log, set isNSFW = false

### Logging Strategy

**Log Levels**: error, warn, info, debug

**Log Format**:
```
[TIMESTAMP] [LEVEL] [COMPONENT] Message
[2024-01-01T12:00:00Z] [INFO] NSFWDetector Analyzing: "breach description..."
[2024-01-01T12:00:00Z] [DEBUG] ConfidenceScorer Score: 0.75 (porn: 0.9, adult: 0.8, proximity: ×1.3)
```

**Logged Events**:
- Detector initialization (info)
- Configuration loaded (info)
- Term dictionary loaded (info)
- Analysis results (debug)
- Detected terms (debug)
- Confidence calculations (debug)
- Context analysis (debug)
- Errors (error)
- Warnings (warn)

### Debug Mode

Enable detailed logging:

```javascript
const detector = new NSFWDetector(configPath, { debug: true });
// Logs all analysis steps, matches, scoring calculations
```

---

## Configuration File Structure

### Main Configuration

**File**: `.kiro/specs/nsfw-detection-system/config.json`

```json
{
  "detector": {
    "confidenceThreshold": 0.5,
    "contextWindowSize": 5,
    "enableContextAnalysis": true,
    "enableNegationHandling": true,
    "enableFuzzyMatching": false,
    "fuzzyMatchThreshold": 0.85,
    "proximityWindow": 10,
    "proximityMultiplier": 1.3,
    "maxAnalysisTime": 10
  },
  "categories": {
    "enabled": [
      "adult_content",
      "dating_services",
      "escort_services"
    ],
    "disabled": []
  },
  "logging": {
    "enabled": true,
    "level": "info",
    "logDetectedTerms": true,
    "logConfidenceScores": true,
    "logContext": false
  },
  "customRules": {
    "enabled": false,
    "rules": []
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `confidenceThreshold` | number | 0.5 | Score threshold for isNSFW = true |
| `contextWindowSize` | number | 5 | Words to examine around term |
| `enableContextAnalysis` | boolean | true | Enable context-aware scoring |
| `enableNegationHandling` | boolean | true | Reduce score for negated terms |
| `enableFuzzyMatching` | boolean | false | Enable fuzzy string matching |
| `fuzzyMatchThreshold` | number | 0.85 | Similarity threshold for fuzzy match |
| `proximityWindow` | number | 10 | Words between terms for proximity boost |
| `proximityMultiplier` | number | 1.3 | Multiplier for multiple terms |
| `maxAnalysisTime` | number | 10 | Max milliseconds per analysis |

---

## API/Interface Design for the Detector

### Main Detector Class

```javascript
class NSFWDetector {
  constructor(configPath, options = {})
  analyze(text) → AnalysisResult
  analyzeBatch(texts) → AnalysisResult[]
  updateConfiguration(newConfig) → void
  addCustomRule(ruleName, ruleFn) → void
  getStatistics() → Statistics
}
```

### AnalysisResult Interface

```javascript
{
  isNSFW: boolean,
  confidence: number,
  detectedTerms: string[],
  reasoning: string,
  details: {
    matches: Match[],
    contextAnalysis: ContextAnalysis,
    scoringBreakdown: ScoringBreakdown
  }
}
```

### Match Interface

```javascript
{
  term: string,
  category: string,
  baseConfidence: number,
  finalConfidence: number,
  position: number,
  context: string,
  contextModifiers: {
    hasNegation: boolean,
    contextType: string
  }
}
```

### Usage Examples

```javascript
// Basic usage
const detector = new NSFWDetector('./config.json');
const result = detector.analyze('Description of adult content');
console.log(result.isNSFW); // true
console.log(result.confidence); // 0.85

// Batch processing
const results = detector.analyzeBatch(descriptions);

// Custom configuration
detector.updateConfiguration({ confidenceThreshold: 0.7 });

// Custom detection rule
detector.addCustomRule('customAdultDetection', (text) => {
  return /\b(custom_term)\b/i.test(text);
});

// Statistics
const stats = detector.getStatistics();
console.log(stats.totalAnalyzed); // 1000
console.log(stats.averageConfidence); // 0.62
```

---

## Testing Strategy

### Unit Testing Approach

**Test Categories**:

1. **Term Dictionary Tests**
   - Load and parse term dictionary
   - Verify term structure and metadata
   - Test term lookup and retrieval

2. **Pattern Matching Tests**
   - Test exact word boundary matching
   - Test phrase matching
   - Test case-insensitive matching
   - Test normalization (whitespace, punctuation, accents)
   - Test partial word rejection

3. **Confidence Scoring Tests**
   - Test base score assignment
   - Test proximity multiplier
   - Test context reduction
   - Test negation reduction
   - Test score clamping

4. **Context Analysis Tests**
   - Test negation detection
   - Test context window extraction
   - Test context classification

5. **Integration Tests**
   - Test full analysis pipeline
   - Test error handling
   - Test configuration loading
   - Test resort-breaches.js integration

### Property-Based Testing Approach

Property-based tests verify universal properties across many generated inputs.

**Test Configuration**:
- Minimum 100 iterations per property test
- Use fast-check or similar library
- Tag each test with design property reference

### Example Unit Tests

```javascript
describe('NSFWDetector', () => {
  describe('Pattern Matching', () => {
    it('should match exact terms with word boundaries', () => {
      const detector = new NSFWDetector(configPath);
      const matches = detector.findMatches('This is porn content');
      expect(matches).toContainEqual(expect.objectContaining({ term: 'porn' }));
    });
    
    it('should not match partial words', () => {
      const detector = new NSFWDetector(configPath);
      const matches = detector.findMatches('This is pornography');
      expect(matches).not.toContainEqual(expect.objectContaining({ term: 'porn' }));
    });
  });
  
  describe('Confidence Scoring', () => {
    it('should return 0 for empty text', () => {
      const detector = new NSFWDetector(configPath);
      const result = detector.analyze('');
      expect(result.confidence).toBe(0);
    });
    
    it('should increase confidence for multiple terms', () => {
      const detector = new NSFWDetector(configPath);
      const result1 = detector.analyze('porn');
      const result2 = detector.analyze('porn and adult content');
      expect(result2.confidence).toBeGreaterThan(result1.confidence);
    });
  });
});
```

### Example Property-Based Tests

```javascript
describe('NSFWDetector Properties', () => {
  it('Property 1: Normalization preserves detection', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const detector = new NSFWDetector(configPath);
        const result1 = detector.analyze(text);
        const result2 = detector.analyze(text.toUpperCase());
        expect(result1.isNSFW).toBe(result2.isNSFW);
      }),
      { numRuns: 100 }
    );
  });
  
  it('Property 2: Confidence is always in [0, 1]', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const detector = new NSFWDetector(configPath);
        const result = detector.analyze(text);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- Unit tests: >90% code coverage
- Property tests: All acceptance criteria with testable properties
- Integration tests: Full pipeline with resort-breaches.js
- Edge cases: Empty strings, null values, special characters, very long texts

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Term Variations Detection

*For any* NSFW term and its known variations, analyzing text containing the variation should result in detection of that term.

**Validates: Requirements 1.2**

### Property 2: Synonym Detection

*For any* NSFW term and its known synonyms, analyzing text containing the synonym should result in detection of the original term.

**Validates: Requirements 1.3**

### Property 3: Confidence Score Range

*For any* text input, the returned confidence score should always be a number between 0 and 1 (inclusive).

**Validates: Requirements 2.1**

### Property 4: Single Term Confidence

*For any* text containing exactly one NSFW term, the detector should return a non-zero confidence score reflecting that term's base reliability.

**Validates: Requirements 2.2**

### Property 5: Multiple Terms Increase Confidence

*For any* text, adding additional NSFW terms should result in a confidence score that is greater than or equal to the score with fewer terms.

**Validates: Requirements 2.3**

### Property 6: Proximity Multiplier Application

*For any* text containing two NSFW terms within 10 words of each other, the confidence score should be greater than the score for the same terms separated by more than 10 words.

**Validates: Requirements 2.4**

### Property 7: Threshold-Based Classification

*For any* text and a given confidence threshold, the isNSFW boolean should be true if and only if the confidence score is greater than or equal to the threshold.

**Validates: Requirements 2.5**

### Property 8: Non-NSFW Context Reduces Confidence

*For any* NSFW term appearing in a clearly non-NSFW context (e.g., "sex education", "dating app security"), the confidence score should be lower than the same term in a neutral context.

**Validates: Requirements 3.2**

### Property 9: Negation Reduces Confidence

*For any* NSFW term preceded by a negation word (not, no, without, never, avoid, prevent), the confidence score should be lower than the same term without negation.

**Validates: Requirements 3.3**

### Property 10: Case-Insensitive Matching

*For any* text, analyzing it in different cases (lowercase, uppercase, mixed case) should produce the same isNSFW result.

**Validates: Requirements 4.1**

### Property 11: Whitespace and Punctuation Normalization

*For any* text, adding or removing whitespace and punctuation should not change the isNSFW result if the core terms remain present.

**Validates: Requirements 4.2**

### Property 12: Accent Normalization

*For any* NSFW term with accented characters, the detector should find matches regardless of whether accents are present in the input text.

**Validates: Requirements 4.3**

### Property 13: Word Boundary Matching

*For any* NSFW term, the detector should not match it when it appears as part of a larger word (e.g., "sex" should not match "sexuality" unless explicitly configured).

**Validates: Requirements 4.4**

### Property 14: External Configuration Loading

*For any* valid configuration file, the detector should successfully load term definitions from the external file and use them for detection.

**Validates: Requirements 5.2**

### Property 15: Breach Object Property Setting

*For any* breach object with a Description field, after analysis, the breach object should have both isNSFW and nsfwConfidence properties set.

**Validates: Requirements 6.2, 6.3**

### Property 16: Error Graceful Handling

*For any* error condition during analysis (invalid input, missing configuration, etc.), the detector should not throw an exception but instead return a safe default result with isNSFW = false.

**Validates: Requirements 6.5**

### Property 17: Single Description Performance

*For any* breach description, the analysis should complete within 10 milliseconds.

**Validates: Requirements 7.1**

### Property 18: Batch Processing Performance

*For any* batch of 1000 breach descriptions, the total analysis time should not exceed 5 seconds (average 5ms per description).

**Validates: Requirements 7.2**

### Property 19: Configurable Threshold Application

*For any* text and two different confidence thresholds, if threshold1 < threshold2, then the isNSFW result with threshold1 should be greater than or equal to the result with threshold2.

**Validates: Requirements 8.2**

### Property 20: Category Filtering

*For any* text containing terms from disabled categories, the detector should not detect those terms when the category is disabled.

**Validates: Requirements 8.3**

### Property 21: Context Analysis Toggle

*For any* text, enabling and disabling context-aware detection should produce different confidence scores (context analysis should affect the result).

**Validates: Requirements 8.4**

### Property 22: Edge Case Handling

*For any* edge case input (empty string, null value, special characters, very long text), the detector should handle it gracefully without throwing an exception.

**Validates: Requirements 9.3**

### Property 23: Score Consistency

*For any* identical text input, analyzing it multiple times should produce identical confidence scores.

**Validates: Requirements 9.4**

---

## Error Handling

### Error Scenarios

1. **Configuration File Not Found**
   - Action: Log warning, use default configuration
   - Result: Detector continues with defaults

2. **Invalid JSON in Configuration**
   - Action: Log error, throw initialization error
   - Result: Script halts, requires manual fix

3. **Missing Term Dictionary**
   - Action: Log warning, use empty dictionary
   - Result: Detector returns confidence 0 for all inputs

4. **Null or Undefined Input**
   - Action: Return { isNSFW: false, confidence: 0 }
   - Result: No exception thrown

5. **Regex Compilation Failure**
   - Action: Log error, skip problematic term
   - Result: Term not detected, analysis continues

6. **Analysis Timeout**
   - Action: Log warning, return partial result
   - Result: Return best result so far, mark as incomplete

### Error Recovery

```javascript
try {
  const result = detector.analyze(text);
  breach.isNSFW = result.isNSFW;
  breach.nsfwConfidence = result.confidence;
} catch (error) {
  logger.error(`NSFW detection failed for breach ${breach.Name}:`, error);
  breach.isNSFW = false;
  breach.nsfwConfidence = 0;
  // Continue processing
}
```

---

## Testing Strategy

### Unit Testing

**Test Framework**: Jest or Mocha

**Test Categories**:

1. **Term Dictionary Tests**
   ```javascript
   describe('TermDictionary', () => {
     it('should load terms from configuration file', () => {
       const dict = new TermDictionary('./terms.json');
       expect(dict.getAllTerms().length).toBeGreaterThan(0);
     });
     
     it('should retrieve term by name', () => {
       const term = dict.getTerm('porn');
       expect(term).toBeDefined();
       expect(term.variations).toContain('porno');
     });
   });
   ```

2. **Pattern Matching Tests**
   ```javascript
   describe('PatternMatcher', () => {
     it('should match exact terms with word boundaries', () => {
       const matcher = new PatternMatcher(terms);
       const matches = matcher.findMatches('This is porn content');
       expect(matches).toContainEqual(expect.objectContaining({ term: 'porn' }));
     });
     
     it('should not match partial words', () => {
       const matches = matcher.findMatches('This is pornography');
       expect(matches).not.toContainEqual(expect.objectContaining({ term: 'porn' }));
     });
     
     it('should match case-insensitively', () => {
       const matches1 = matcher.findMatches('PORN');
       const matches2 = matcher.findMatches('porn');
       expect(matches1.length).toBe(matches2.length);
     });
   });
   ```

3. **Confidence Scoring Tests**
   ```javascript
   describe('ConfidenceScorer', () => {
     it('should return 0 for empty text', () => {
       const result = detector.analyze('');
       expect(result.confidence).toBe(0);
     });
     
     it('should increase confidence for multiple terms', () => {
       const result1 = detector.analyze('porn');
       const result2 = detector.analyze('porn and adult content');
       expect(result2.confidence).toBeGreaterThan(result1.confidence);
     });
     
     it('should apply proximity multiplier', () => {
       const result1 = detector.analyze('porn ... ... ... ... ... ... ... ... ... ... adult');
       const result2 = detector.analyze('porn adult');
       expect(result2.confidence).toBeGreaterThan(result1.confidence);
     });
   });
   ```

4. **Context Analysis Tests**
   ```javascript
   describe('ContextAnalyzer', () => {
     it('should reduce confidence for non-NSFW context', () => {
       const result1 = detector.analyze('porn');
       const result2 = detector.analyze('sex education');
       expect(result2.confidence).toBeLessThan(result1.confidence);
     });
     
     it('should reduce confidence for negation', () => {
       const result1 = detector.analyze('porn');
       const result2 = detector.analyze('not porn');
       expect(result2.confidence).toBeLessThan(result1.confidence);
     });
   });
   ```

5. **Integration Tests**
   ```javascript
   describe('NSFWDetector Integration', () => {
     it('should analyze breach object correctly', () => {
       const breach = { Description: 'Adult content breach' };
       detector.analyzeBreach(breach);
       expect(breach.isNSFW).toBeDefined();
       expect(breach.nsfwConfidence).toBeDefined();
     });
     
     it('should handle errors gracefully', () => {
       const breach = { Description: null };
       expect(() => detector.analyzeBreach(breach)).not.toThrow();
       expect(breach.isNSFW).toBe(false);
     });
   });
   ```

### Property-Based Testing

**Test Framework**: fast-check

**Configuration**: Minimum 100 iterations per property

**Example Properties**:

```javascript
describe('NSFWDetector Properties', () => {
  it('Property 3: Confidence Score Range', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = detector.analyze(text);
        return result.confidence >= 0 && result.confidence <= 1;
      }),
      { numRuns: 100 }
    );
  });
  
  it('Property 10: Case-Insensitive Matching', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result1 = detector.analyze(text);
        const result2 = detector.analyze(text.toUpperCase());
        return result1.isNSFW === result2.isNSFW;
      }),
      { numRuns: 100 }
    );
  });
  
  it('Property 23: Score Consistency', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result1 = detector.analyze(text);
        const result2 = detector.analyze(text);
        return result1.confidence === result2.confidence;
      }),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Code Coverage**: >90% line coverage
- **Branch Coverage**: >85% branch coverage
- **Property Coverage**: All 23 correctness properties tested
- **Edge Cases**: Empty strings, null values, special characters, very long texts
- **Performance**: Verify <10ms per description, <5s for 1000 descriptions

### Test Data

**Known NSFW Examples**:
- "Adult content breach affecting 50,000 users"
- "Pornographic website database leaked"
- "Escort service client list exposed"

**Known Non-NSFW Examples**:
- "E-commerce platform security breach"
- "Financial institution data leak"
- "Healthcare provider records compromised"

**Edge Cases**:
- Empty string: ""
- Null value: null
- Special characters: "!@#$%^&*()"
- Very long text: 10,000+ characters
- Mixed case: "PoRn AdUlT"
- Accented characters: "porñ"

---

## Summary

This design document provides a comprehensive blueprint for implementing the NSFW Detection System. The system balances accuracy, performance, and maintainability through:

- **Modular Architecture**: Separate components for term management, pattern matching, scoring, and context analysis
- **Configurable Behavior**: External configuration files enable customization without code changes
- **Context-Aware Detection**: Reduces false positives through negation and context analysis
- **Performance Optimization**: Caching, early exit, and efficient algorithms ensure <10ms per analysis
- **Comprehensive Testing**: Both unit and property-based tests verify correctness across all scenarios
- **Clear Integration**: Seamless integration with existing resort-breaches.js workflow

The 23 correctness properties provide formal specifications for all testable requirements, enabling property-based testing to verify universal correctness across many generated inputs.
