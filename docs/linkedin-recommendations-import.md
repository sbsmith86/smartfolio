## Adding LinkedIn Recommendations Import

### Changes needed to `/src/app/api/linkedin/import/route.ts`:

#### 1. Update Interface (lines ~12-30)
```typescript
interface ParsedLinkedInProfile {
  experiences: Array<{...}>;
  education: Array<{...}>;
  skills: Array<{...}>;
  // ADD THIS:
  recommendations: Array<{
    recommenderName: string;
    recommenderTitle?: string;
    recommenderCompany?: string;
    relationship?: string; // "Manager", "Colleague", "Client", etc.
    content: string;
  }>;
}
```

#### 2. Update GPT-4o Prompt (in parseLinkedInWithAI function, ~line 45)
Add to the prompt after skills section:
```typescript
4. recommendations: array of recommendations/testimonials with:
   - recommenderName (string, full name)
   - recommenderTitle (string, optional, their job title)
   - recommenderCompany (string, optional, their company)
   - relationship (string, optional, e.g., "Manager", "Colleague", "Direct Report", "Client")
   - content (string, the full recommendation text)
```

#### 3. Add Testimonial Creation Logic (after education loop, ~line 230)
```typescript
// Create testimonials from recommendations
let testimonialsAdded = 0;
for (const rec of parsed.recommendations) {
  try {
    // Create testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        userId,
        recommenderName: rec.recommenderName,
        recommenderTitle: rec.recommenderTitle || null,
        recommenderCompany: rec.recommenderCompany || null,
        relationship: rec.relationship || null,
        content: rec.content,
        verified: false, // Not verified unless manually confirmed
        public: true, // Show on profile by default
      },
    });

    // Generate embedding for recommendation content
    const text = `Recommendation from ${rec.recommenderName}: ${rec.content}`;
    const embedding = await generateEmbedding(text);

    await prisma.$executeRaw`
      INSERT INTO knowledge_embeddings (id, "userId", "contentType", "contentId", "textContent", embedding, "createdAt")
      VALUES (
        ${`cemb_${Date.now()}_${Math.floor(Math.random() * 1000000)}`},
        ${userId},
        'testimonial',
        ${testimonial.id},
        ${text},
        ${JSON.stringify(embedding)}::vector,
        NOW()
      )
    `;

    embeddingsCreated++;
    testimonialsAdded++;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    errors.push(`Failed to import recommendation from ${rec.recommenderName}`);
  }
}
```

#### 4. Update Response (line ~320)
```typescript
return NextResponse.json({
  success: true,
  experiencesAdded,
  educationAdded,
  skillsAdded,
  testimonialsAdded, // ADD THIS
  embeddingsCreated,
  errors,
});
```

#### 5. Update UI to show testimonials count
In `/src/app/dashboard/import/linkedin/page.tsx`, add a stat card:
```typescript
<div className="bg-green-50 p-4 rounded-lg">
  <div className="text-2xl font-bold text-green-600">{result.testimonialsAdded}</div>
  <div className="text-sm text-gray-600">Recommendations</div>
</div>
```

### Example LinkedIn Text with Recommendations:
```
Experience:
...

Recommendations:
John Smith
Senior Engineering Manager at Google
Worked with Shae at DoSomething

"Shae is an exceptional technical leader who consistently delivered high-quality work.
Their ability to mentor junior developers while driving complex projects forward was
invaluable to our team."

---

Sarah Johnson
Product Manager at IHG
Managed Shae directly

"I had the pleasure of working with Shae on several critical initiatives. Their technical
expertise combined with strong communication skills made them a key contributor to our
product success."
```

### Benefits:
- ✅ **Automated**: No manual entry needed
- ✅ **Searchable**: Embeddings make recommendations searchable via chat
- ✅ **Social Proof**: Displays on profile page (already has testimonials section)
- ✅ **Competition Value**: Shows multi-source aggregation (resume + GitHub + LinkedIn recommendations)

### Time Estimate:
- 30-45 minutes to implement
- Already has database schema and UI (just needs parsing logic)
