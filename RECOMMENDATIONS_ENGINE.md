# AI-Powered Recommendations Engine

## Overview

The Watch Me app features an intelligent recommendations engine that uses Anthropic's Claude Haiku 4.5 to suggest personalized content from your watchlist. The engine combines multiple strategies, smart data filtering, and robust fallback mechanisms to provide varied and relevant recommendations.

## How It Works

### 1. Data Collection & Preparation
- **User Watchlist**: Fetches all items from the user's watchlist via Prisma ORM
- **Status Filtering**: Focuses on "want-to-watch" items for recommendations
- **Metadata Enrichment**: Includes TMDB data (posters, descriptions, ratings, runtime, seasons)

### 2. Strategy Selection
The system randomly selects from 6 different recommendation strategies:

#### Available Strategies

| Strategy | Focus | Data Filter | Use Case |
|----------|-------|-------------|----------|
| **Recent Additions** | Most recently added items | Latest 10 want-to-watch items | Fresh content discovery |
| **Highly Rated Similar** | Items similar to loved content | Want-to-watch items + loved finished items | Quality-focused recommendations |
| **Quick Wins** | Short, satisfying content | Movies + shows ≤2 seasons | Time-constrained viewing |
| **Deep Dives** | Immersive, longer content | Shows >2 seasons + movies >120min | Extended viewing sessions |
| **Mood Boosters** | Uplifting entertainment | Want-to-watch items | Positive mood enhancement |
| **Hidden Gems** | Underrated/overlooked content | Shuffled want-to-watch items | Discovery of lesser-known content |
| **Continue Watching** | Shows with unwatched seasons | In-progress shows + finished shows with more seasons | Remind users to continue series they've started |

### 3. Data Processing Pipeline

```typescript
// 1. Filter by strategy
const filteredWatchlist = strategy.filter(watchlist);

// 2. Shuffle for variety
const shuffledWatchlist = [...filteredWatchlist].sort(() => Math.random() - 0.5);

// 3. Add context
const timeContext = getTimeOfDay(); // morning/afternoon/evening/night
const timestamp = Date.now(); // Unique request identifier
```

### 4. AI Prompt Engineering

The engine constructs detailed prompts that include:

- **Strategy Context**: Which strategy is being used and its focus
- **Time Context**: Current time of day for mood-appropriate suggestions
- **Item Details**: ID, title, type, status, rating, notes (truncated)
- **Available IDs**: Explicit list of valid IDs to prevent AI from making up sequential numbers
- **Available Titles**: Explicit list of valid titles to prevent AI from using non-existent titles
- **Instructions**: Clear guidance on response format and ID usage
- **Examples**: Concrete examples showing exact expected response format

**Example Prompt Structure:**
```
Analyze this watchlist subset and recommend 5 "want-to-watch" items to prioritize. 
[Strategy Focus]. It's [time] time (timestamp: [timestamp]):

ID: 78 - The Expanse (show, want-to-watch), rated: loved, notes: Sci-fi masterpiece
ID: 77 - Silo (show, want-to-watch)
...

Strategy: deep dives. Consider: ratings, content type preferences, themes, time commitment, recency, and the current time of day.

AVAILABLE TITLES: The Expanse, Silo, Mr. Robot, Six Feet Under, This Is the End

CRITICAL INSTRUCTIONS:
1. You MUST return the EXACT numeric ID from the list above
2. You MUST include the EXACT title from the list above
3. Your reason MUST describe the specific item you are recommending (the one with that ID)
4. Do NOT mention other items in your reason
5. Do NOT return "undefined" or titles
6. Do NOT make up sequential IDs (1,2,3,4,5)
7. Only use the numeric IDs shown in the list: 78, 77, 76, 75, 74, 73, 72, 71

EXAMPLE: If you want to recommend "The Expanse" (ID: 78), your response should be:
{"id": 78, "title": "The Expanse", "reason": "The Expanse offers an immersive sci-fi experience...", "confidence": 0.8}

Return JSON array:
[{"id": [exact_numeric_id], "title": "[exact_title_from_list]", "reason": "[2-3 sentence reason about THIS specific item]", "confidence": [0.1-1.0]}]
```

#### Prompt Engineering Best Practices

**✅ DO:**
- **Include explicit examples** showing the exact format expected
- **List available options** (IDs and titles) to prevent AI from making up data
- **Use numbered instructions** for clarity and emphasis
- **Provide context** (time of day, strategy focus) for better recommendations
- **Include timestamps** to prevent AI caching of identical requests
- **Use clear, specific language** ("MUST", "EXACT", "CRITICAL")

**❌ DON'T:**
- **Rely on implicit instructions** - be explicit about requirements
- **Use vague language** like "try to" or "maybe"
- **Assume AI will follow format** without examples
- **Forget to validate** AI responses against source data
- **Use generic examples** - use real data from the current request

**🔧 Key Improvements Made:**
1. **Added title requirement** to prevent ID/title mismatches
2. **Included available titles list** to constrain AI choices
3. **Enhanced validation** to catch and filter invalid responses
4. **Added concrete examples** showing exact expected format
5. **Improved error logging** for debugging mismatches

### 5. AI Response Processing

#### Response Validation
```typescript
// Filter out invalid responses
let validRecommendations = aiRecommendations.filter((rec: any) => 
  rec.id && rec.id !== "undefined" && rec.id !== undefined && !isNaN(Number(rec.id))
);

// Additional validation: ensure the AI's title matches an item in our shuffled watchlist
validRecommendations = validRecommendations.filter((rec: any) => {
  if (!rec.title) return false;
  
  const matchingItem = shuffledWatchlist.find(item => 
    item.title.toLowerCase() === rec.title.toLowerCase()
  );
  
  if (!matchingItem) {
    console.log('❌ AI title does not match any item:', rec.title);
    return false;
  }
  
  // Also verify the ID matches the title
  if (matchingItem.id !== rec.id) {
    console.log('❌ AI ID and title mismatch:', rec.id, 'vs', matchingItem.id, 'for title:', rec.title);
    return false;
  }
  
  return true;
});
```

#### Item Matching Algorithm
1. **Exact ID Match**: Try to find item by exact ID
2. **Title Fallback**: If ID not found, try matching by title (case-insensitive)
3. **Smart Fallback**: If partial success, match remaining AI reasons to available items

#### Fallback Mechanisms
- **Partial Success**: If some AI recommendations work, preserve AI reasons for remaining items
- **Complete Fallback**: If AI fails entirely, use random items with generic reasons
- **Error Recovery**: Always return recommendations, even if all systems fail

### 6. Response Enhancement

The engine enriches recommendations with:
- **TMDB Metadata**: Posters, descriptions, release years, runtime, seasons
- **Confidence Scores**: AI-generated confidence levels (0.1-1.0)
- **Strategy Information**: Which strategy was used and its focus
- **Timestamp**: When recommendations were generated

## Technical Implementation

### API Endpoint
- **Route**: `/api/recommendations`
- **Method**: GET
- **Authentication**: Required (Supabase session)
- **Response Time**: ~5-10 seconds (Anthropic API dependent)

### Error Handling
- **Database Failures**: Graceful degradation with empty watchlist
- **Anthropic Failures**: Fallback to random recommendations
- **Mapping Failures**: Smart fallback preserving AI quality where possible
- **Network Issues**: Retry logic and timeout handling

### Performance Optimizations
- **Data Shuffling**: Ensures variety without additional API calls
- **Timestamp Injection**: Prevents AI caching of identical requests
- **Random Temperature**: 0.8-1.0 range for creative variety
- **Strategy Rotation**: Random selection prevents recommendation stagnation

## Configuration

### Environment Variables
```bash
ANTHROPIC_API_KEY=sk-ant-... # Required for AI recommendations
```

### Strategy Configuration
Strategies can be easily modified in `frontend/src/app/api/recommendations/route.ts`:

```typescript
const strategies = [
  {
    name: "strategy_name",
    filter: (items: WatchItem[]) => /* filtering logic */,
    focus: "strategy description"
  }
];
```

## Future Enhancements

### Planned Improvements
- **User Preference Learning**: Track which recommendations users engage with
- **Collaborative Filtering**: Use data from similar users
- **Content-Based Filtering**: Analyze genres, themes, and metadata
- **Seasonal Recommendations**: Time-based content suggestions
- **Mood-Based Filtering**: User mood input for contextual recommendations
- **Continue Watching Enhancement**: Track current season progress and suggest next episodes

### Technical Roadmap
- **Caching Layer**: Redis for frequently requested recommendations
- **Batch Processing**: Generate recommendations in background
- **A/B Testing**: Test different strategies and prompts
- **Analytics**: Track recommendation performance and user engagement
- **Personalization**: User-specific strategy preferences

## Monitoring & Debugging

### Logging
The engine provides comprehensive logging:
- Strategy selection and data filtering
- AI prompt construction and response parsing
- Item matching success/failure rates
- Fallback mechanism usage
- Performance metrics

### Umami Events
- `ai_recommendation_requested` fires on every recommendations request; `ai_fallback_fired` fires when the API `phase` indicates a fallback path, with `reason` set to that phase value.

### Key Metrics
- **Success Rate**: Percentage of AI recommendations that map successfully
- **Strategy Distribution**: Which strategies are most effective
- **Response Time**: API performance monitoring
- **User Engagement**: Which recommendations users interact with
- **Continue Watching Success**: How often users follow up on season continuation suggestions

## Troubleshooting

### Common Issues
1. **Same Recommendations**: Check strategy rotation and data shuffling
2. **Generic Reasons**: Verify AI response parsing and fallback logic
3. **Slow Response**: Monitor Anthropic API performance and caching
4. **Mapping Failures**: Review AI prompt clarity and ID validation
5. **Title/Reason Mismatches**: Check AI title validation and prompt examples
6. **AI Using Non-existent Titles**: Verify available titles list in prompt
7. **Auto-refresh Issues**: Check useEffect dependencies and initialization logic
8. **Continue Watching Not Triggering**: Verify show has multiple seasons and correct status

### Debug Commands
```bash
# Check Anthropic API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":8,"messages":[{"role":"user","content":"ping"}]}'

# Test recommendation endpoint
curl -H "Cookie: [session_cookie]" http://localhost:3001/api/recommendations
```

### Avoiding Prompt-Related Issues

**🔍 Common AI Prompt Problems & Solutions:**

1. **AI Ignores Format Instructions**
   - **Problem**: AI returns wrong format despite instructions
   - **Solution**: Include concrete examples with real data from the current request
   - **Example**: Show exact JSON structure with actual IDs and titles

2. **AI Uses Non-existent Data**
   - **Problem**: AI makes up IDs, titles, or other data not in source
   - **Solution**: Explicitly list all available options (IDs, titles, etc.)
   - **Example**: `AVAILABLE TITLES: The Expanse, Silo, Mr. Robot`

3. **AI Confuses Similar Items**
   - **Problem**: AI recommends one item but describes another
   - **Solution**: Require AI to include both ID and title, validate consistency
   - **Example**: Check that ID 50 matches title "The Smashing Machine"

4. **AI Returns Generic Responses**
   - **Problem**: AI gives vague reasons that could apply to any item
   - **Solution**: Explicitly instruct AI to describe the specific item being recommended
   - **Example**: "Your reason MUST describe the specific item you are recommending"

5. **AI Caches Responses**
   - **Problem**: AI returns same recommendations for identical requests
   - **Solution**: Include unique timestamps and random temperature values
   - **Example**: `timestamp: ${Date.now()}` and `temperature: 0.8 + (Math.random() * 0.2)`

**🧪 Testing Prompt Changes:**
- Always test with real data from your watchlist
- Check server logs for validation messages
- Verify title/reason consistency in UI
- Test multiple recommendation requests to ensure variety

---

*This documentation should be updated as the recommendation system evolves. Last updated: December 2024*
