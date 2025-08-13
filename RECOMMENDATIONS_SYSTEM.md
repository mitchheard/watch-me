# AI-Powered Recommendations System

## Overview

The Watch Me app features an intelligent recommendation system that uses OpenAI's GPT-4o-mini to suggest personalized content from your watchlist. The system combines multiple strategies, smart data filtering, and robust fallback mechanisms to provide varied and relevant recommendations.

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

The system constructs detailed prompts that include:

- **Strategy Context**: Which strategy is being used and its focus
- **Time Context**: Current time of day for mood-appropriate suggestions
- **Item Details**: ID, title, type, status, rating, notes (truncated)
- **Available IDs**: Explicit list of valid IDs to prevent AI from making up sequential numbers
- **Instructions**: Clear guidance on response format and ID usage

**Example Prompt Structure:**
```
Analyze this watchlist subset and recommend 5 "want-to-watch" items to prioritize. 
[Strategy Focus]. It's [time] time (timestamp: [timestamp]):

ID: 78 - The Expanse (show, want-to-watch), rated: loved, notes: Sci-fi masterpiece
ID: 77 - Silo (show, want-to-watch)
...

Strategy: deep dives. Consider: ratings, content type preferences, themes, time commitment, recency, and the current time of day.

CRITICAL: You MUST return the EXACT numeric ID from the list above. 
The available IDs are: 78, 77, 76, 75, 74, 73, 72, 71.

Return JSON array:
[{"id": [exact_numeric_id], "reason": "[2-3 sentence reason]", "confidence": [0.1-1.0]}]
```

### 5. AI Response Processing

#### Response Validation
```typescript
// Filter out invalid responses
const validRecommendations = aiRecommendations.filter((rec: any) => 
  rec.id && rec.id !== "undefined" && rec.id !== undefined && !isNaN(Number(rec.id))
);
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

The system enriches recommendations with:
- **TMDB Metadata**: Posters, descriptions, release years, runtime, seasons
- **Confidence Scores**: AI-generated confidence levels (0.1-1.0)
- **Strategy Information**: Which strategy was used and its focus
- **Timestamp**: When recommendations were generated

## Technical Implementation

### API Endpoint
- **Route**: `/api/recommendations`
- **Method**: GET
- **Authentication**: Required (Supabase session)
- **Response Time**: ~5-10 seconds (OpenAI API dependent)

### Error Handling
- **Database Failures**: Graceful degradation with empty watchlist
- **OpenAI Failures**: Fallback to random recommendations
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
OPENAI_API_KEY=sk-... # Required for AI recommendations
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

### Technical Roadmap
- **Caching Layer**: Redis for frequently requested recommendations
- **Batch Processing**: Generate recommendations in background
- **A/B Testing**: Test different strategies and prompts
- **Analytics**: Track recommendation performance and user engagement
- **Personalization**: User-specific strategy preferences

## Monitoring & Debugging

### Logging
The system provides comprehensive logging:
- Strategy selection and data filtering
- AI prompt construction and response parsing
- Item matching success/failure rates
- Fallback mechanism usage
- Performance metrics

### Key Metrics
- **Success Rate**: Percentage of AI recommendations that map successfully
- **Strategy Distribution**: Which strategies are most effective
- **Response Time**: API performance monitoring
- **User Engagement**: Which recommendations users interact with

## Troubleshooting

### Common Issues
1. **Same Recommendations**: Check strategy rotation and data shuffling
2. **Generic Reasons**: Verify AI response parsing and fallback logic
3. **Slow Response**: Monitor OpenAI API performance and caching
4. **Mapping Failures**: Review AI prompt clarity and ID validation

### Debug Commands
```bash
# Check OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test recommendation endpoint
curl -H "Cookie: [session_cookie]" http://localhost:3001/api/recommendations
```

---

*This documentation should be updated as the recommendation system evolves. Last updated: August 2025*
