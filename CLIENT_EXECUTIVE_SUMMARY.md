# Changelog & Audit System - Executive Summary & Technical Recommendation

## Executive Overview

This document outlines the recommended approach for implementing a comprehensive changelog and audit system for the KONE Repair Management platform, addressing compliance requirements and supporting enterprise scale.

---

## Business Requirements & Context

### Current Scope (MVP - Phase 1)

- **2,000 Service Repair items** in the product catalog
- **72 Sales Organizations** accessing the system
- **Global users** with access to all line items per RFP
- **File-based uploads** as primary data entry method (Excel files)

### Future Scope (Next Phase - Phase 2)

- **200,000+ Materials** with connected configurations
- **Cross-organizational** reporting and compliance
- **Materialized connections** between repairs and materials

### Compliance Mandate

- **Audit requirement**: ALL changes to ALL fields must be logged
- **Immutable trail**: Complete, tamper-proof record of modifications
- **Who, What, When**: Track user identity, fields changed, timestamps
- **Report capability**: Generate compliance-certified reports for audits

---

## Problem Statement

### Challenge 1: Inconsistent Data Entry

**Problem**: Users upload Excel files with:

- Different filenames each time
- Varying columns across uploads
- Missing data in some cells
- Inconsistent data formats

**Solution**: Match records using unique identifier (repairId), ignore missing columns, normalize values before comparison

### Challenge 2: Change Detection at Scale

**Problem**: With 2,000→200,000 items, manually detecting changes becomes expensive:

- Need to fetch all current data
- Compare field-by-field
- Process multiple times per day

**Solution**: Use DynamoDB Streams for automatic, real-time change detection

### Challenge 3: Compliance Audit Trail

**Problem**: Compliance requires complete audit of ALL changes:

- File uploads (currently tracked)
- API edits (future feature)
- UI changes (future feature)
- Scheduled tasks (future feature)

**Solution**: Automatic stream-based auditing captures every change method

### Challenge 4: Multi-Organization Support

**Problem**: 72 sales organizations need:

- Isolated views of their data
- Compliance reports per organization
- Cross-org reporting for global users

**Solution**: Multi-tenant architecture with organization-level filtering

---

## Recommended Solution: DynamoDB Streams + Multi-Tenant Architecture

### Why DynamoDB Streams?

#### 1. **Compliance Excellence** ✅

```
DynamoDB Streams automatically captures EVERY change:
- File uploads: YES
- API edits: YES
- UI modifications: YES
- Scheduled tasks: YES

Manual approach captures only what we code for → GAPS in audit trail
```

#### 2. **Scalability & Cost Efficiency** ✅

```
Cost comparison at scale:

MVP (2,000 repairs):
  Manual detection:    $50-150/year
  Streams approach:   $150-200/year  (+compliance features)
  → Difference: Negligible, Streams adds compliance

Next Phase (200,000 materials):
  Manual detection:    $15,000+/year (expensive!)
  Streams approach:   $700-1,000/year (optimized)
  → Savings: 15x cheaper with Streams
```

#### 3. **Automatic Change Detection** ✅

```
Streams provides old and new values automatically
No need to:
  - Fetch current data from database
  - Manually compare fields
  - Code change detection logic

This works for ANY data change method → future-proof
```

#### 4. **Real-Time Audit Logging** ✅

```
Every change is logged immediately:
- Transaction sequence number (ordering guarantee)
- Old and new values (before/after state)
- Timestamp (accurate timing)
- Event ID (deduplication)

Immutable by design (write-once log)
```

#### 5. **Multi-Organization Support** ✅

```
Built-in support for 72 sales organizations:
  - Org-level filtering built into queries
  - Isolated compliance reports per organization
  - Global view for corporate compliance teams
  - No redundant data fetching
```

---

## Architecture Comparison

### Approach 1: Manual Detection (File Upload Only)

```
Upload file
  ↓
Parse Excel
  ↓
Fetch all current repairs from database ⚠️ (expensive at scale)
  ↓
Compare each field manually
  ↓
Record changes if detected
  ↓
Save to database

ISSUES:
❌ Only works for file uploads (not API/UI edits)
❌ Expensive at scale (200k items)
❌ Misses compliance requirements
❌ Slow response time to user
```

### Approach 2: DynamoDB Streams (Recommended) ✅

```
Upload file/API edit/UI change/Scheduled task
  ↓
Save to database
  ↓
DynamoDB Stream triggers automatically ← Change captured!
  ↓
Lambda processes stream record
  ↓
Automatically detects changes (old image vs new image)
  ↓
Records to immutable changelog
  ↓
Return response to user (fast!)

BENEFITS:
✅ Works for ANY change method (future-proof)
✅ Efficient at scale (only processes actual changes)
✅ Meets compliance requirements
✅ Fast response time (async processing)
✅ Lower total cost of ownership
```

---

## Data Consistency & Validation Strategy

### Handling Inconsistent Excel Files

**Challenge**: Users upload files with different formats, missing columns, incomplete data

**Solution Strategy**:

#### Step 1: Schema Validation

```
REQUIRED: repairId column must be present
  → Used to match with existing items in database
  → Independent of filename

OPTIONAL: Any other columns can be included or omitted
  → Missing column = keep existing value in database
  → No accidental data loss
```

#### Step 2: Data Quality Checks

```
Check for missing values, unusual formats
Return to user: "3 cells are empty - keeping existing values?"
User confirms: "Yes, proceed"
Process continues with validation warnings logged
```

#### Step 3: Value Normalization

```
Before comparing, normalize values:
  "IN_PROGRESS" vs "in progress" → treated as SAME
  Whitespace trimmed
  Case standardized
  Date formats normalized
```

#### Step 4: Smart Field Handling

```
Empty/null in upload = KEEP existing value
  Example: User uploads file without Priority column
           Existing Priority values are preserved

This prevents accidental data clearing
```

---

## System Architecture

```
┌──────────────────────────────────────────────┐
│  File Upload / API / UI / Scheduled Tasks    │
└─────────────────┬──────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  Repairs Table      │  ◄──── Enable DynamoDB Stream
        │  (DynamoDB)         │        StreamViewType: NEW_AND_OLD_IMAGES
        │  - Multi-tenant     │
        │  - Organization ID  │
        └────────┬────────────┘
                 │
                 ▼ Automatic Stream Trigger
        ┌──────────────────────┐
        │ Stream Processor     │  ◄──── Serverless Lambda
        │ Lambda               │        Auto-scales with load
        └───────┬──────────────┘
                │
        ┌───────┴────────┬──────────────┐
        ▼                ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌─────────────┐
    │Changelog │  │Metadata  │  │Compliance   │
    │Table     │  │Table     │  │Export (S3)  │
    │(Immutable)  │(Upload   │  │(Legal Hold) │
    │Audit Log│  │Batches)  │  │             │
    └──────────┘  └──────────┘  └─────────────┘
         ↓
    ┌─────────────────────────────────┐
    │  Query Endpoints for Users      │
    │  - Global: All orgs, all data   │
    │  - Org users: Their org only    │
    │  - Compliance: Audit reports    │
    └─────────────────────────────────┘
```

---

## Compliance Features

### 1. Immutable Audit Log

```
Once a change is logged, it CANNOT be modified or deleted
- Database permissions enforce write-only access
- Tamper-proof by design
- Time-ordered sequence maintained
- Integrity hashes for verification
```

### 2. Complete Change Tracking

```
Every field change is recorded:
- Field name
- Previous value
- New value
- Who made the change
- When it was made
- Which file/API/method triggered it
- Organization context
```

### 3. Legal Hold Support

```
Mark changelog entries as "under legal hold"
- Cannot be deleted or archived
- Retention period enforced
- Compliance certification generated
- Export for legal discovery
```

### 4. Compliance Reports

```
Generate certified audit reports:
- Changes by date range
- Changes by organization
- Changes by user
- Changes by field type
- Integrity hash verification
- Digital signature
- Export to secure storage (S3)
```

---

## Cost Analysis

### MVP Phase (2,000 Repairs, 72 Organizations)

```
Monthly Costs:
  - Stream reads:           $0.20
  - Lambda invocations:     $0.001
  - Lambda compute:         $0.042
  - DynamoDB writes:        $0.0125
  - DynamoDB reads:         $0.0063
  ─────────────────────────────────
  Subtotal:                 $0.27/month

Annual Infrastructure: $3.24
Compliance Reports:    $50-100 (S3 storage, generation)
─────────────────────────────────
Total Annual Cost:     $150-200 ✅
```

### Next Phase (200,000 Materials + 2,000 Repairs)

```
Monthly Costs:
  - Stream reads:           $10
  - Lambda invocations:     $0.05
  - Lambda compute:         $1.67
  - DynamoDB writes:        $0.125
  - DynamoDB reads:         $0.063
  - Archive to S3:          $2-3
  ─────────────────────────────────
  Subtotal:                 $14/month

Annual Infrastructure: $168
Compliance Reports:    $500-700 (72 org reports annually)
─────────────────────────────────
Total Annual Cost:     $700-1,000 ✅

Cost per item:         $0.003-0.005 per repair/material
```

### Comparison: Manual Approach at Scale

```
Manual detection cost for 200,000 items:
  - Fetching 200k items repeatedly
  - Comparing field-by-field
  - Processing multiple times daily
  ─────────────────────────────────
  Est. Annual Cost:    $15,000+

Streams advantage:     14x cheaper ✅
```

---

## Implementation Timeline

### Phase 1: MVP (4-6 weeks)

```
Week 1-2:
  ✓ Create DynamoDB tables with Stream enabled
  ✓ Deploy Stream Processor Lambda
  ✓ Basic changelog infrastructure

Week 3-4:
  ✓ Multi-tenant support (72 organizations)
  ✓ Changelog query endpoints
  ✓ Compliance report endpoint

Week 5-6:
  ✓ Testing with 2,000 repair items
  ✓ Compliance certification
  ✓ Documentation for auditors
  ✓ User training on data quality
```

### Phase 2: Next Phase (Parallel or Sequential)

```
Sprint 1-2:
  ✓ Create materials table with stream
  ✓ Bulk import optimization (200k items)
  ✓ Material-to-repair connection tracking

Sprint 3-4:
  ✓ Cross-entity changelog queries
  ✓ Material impact reporting
  ✓ Extended compliance integration
```

---

## Key Benefits Summary

### ✅ Compliance

- Audit trail of ALL changes (not just uploads)
- Immutable, tamper-proof logs
- Legal hold and retention support
- Compliance-certified reports

### ✅ Scalability

- Handles 2,000 → 200,000+ items efficiently
- Per-organization isolation and reporting
- Global user access with security
- No architectural changes needed as you scale

### ✅ Cost-Effectiveness

- $150-200/year for MVP
- $700-1,000/year for full scale with 200k items
- 14x cheaper than manual approach at scale
- Optimization built-in

### ✅ Future-Proof

- Works for file uploads TODAY
- Ready for API edits TOMORROW
- Ready for UI changes NEXT WEEK
- Ready for scheduled tasks WHENEVER

### ✅ Reliability

- Automatic, no manual detection code
- Real-time processing
- Deduplication built-in
- Error handling and retry logic

### ✅ Performance

- Fast user response times (async changelog)
- Efficient database queries
- Optimized for 72 organizations
- Sub-second response for queries

---

## Security & Data Protection

### Access Control

```
Different access levels:
  - Global users:        Full audit across all organizations
  - Organization users:  Their organization data only
  - Compliance team:     Legal hold access, reports
  - Read-only:           Query access, no modification

IAM policies enforce permissions at Lambda/DynamoDB level
```

### Data Encryption

```
  - In-transit: TLS/HTTPS
  - At-rest: DynamoDB encryption
  - Archive: S3 server-side encryption
  - Compliance reports: S3 encryption + access control
```

### Audit Trail Protection

```
  - Changelog table: Write-only (no delete/update)
  - Legal hold entries: Permanently retained
  - Integrity verification: Cryptographic hashes
  - Archive: Immutable S3 storage
```

---

## Risk Mitigation

### Data Quality Risk

**Risk**: Users upload files with missing/inconsistent data
**Mitigation**:

- Pre-upload validation endpoint
- User confirmation for empty cells
- Data quality scoring and warnings
- Keep existing values for empty columns

### Compliance Audit Risk

**Risk**: Changes not properly logged
**Mitigation**:

- DynamoDB Streams ensures automatic logging
- No code path can bypass changelog
- Real-time verification of immutability
- Monthly compliance checks

### Performance Risk

**Risk**: Changelog processing delays
**Mitigation**:

- Lambda processes asynchronously
- No impact on user response time
- DLQ for failed records
- Batch processing optimization

### Cost Risk

**Risk**: Unexpected AWS charges
**Mitigation**:

- Fixed-cost model (per-operation pricing)
- Monitoring and alerting
- Predictable at scale
- No surprise charges

---

## Success Criteria

### MVP Success

- ✅ 2,000 repairs fully tracked in changelog
- ✅ Changes detected for 72 organizations
- ✅ Compliance reports generated successfully
- ✅ Response time <500ms for queries
- ✅ All changes immutable and auditable

### Phase 2 Success

- ✅ 200,000 materials tracked
- ✅ Material-repair connections audited
- ✅ Cross-organizational reporting working
- ✅ Cost remains under $1,000/year
- ✅ Compliance certified and approved

---

## Recommendation & Next Steps

### Recommendation: **Proceed with DynamoDB Streams Architecture**

**Rationale:**

1. Meets compliance requirements completely
2. Cost-effective at all scales
3. Future-proof for growth to 200k items
4. Automatic, reliable, maintainable
5. Supports 72 organizations natively
6. No additional cost for adding features (API, UI, scheduled tasks)

### Immediate Next Steps

1. **Approval** - Client confirmation to proceed
2. **Requirements Clarification** - Confirm 72 organizations, data model
3. **Infrastructure Setup** - Deploy tables, enable streams
4. **Lambda Development** - Build stream processor
5. **Testing** - Validate with sample data
6. **Compliance Review** - Audit by compliance team
7. **Production Deployment** - MVP goes live

---

## Questions & Discussions

### Q1: What if we only need file uploads, not API edits?

**A**: Streams is still the right choice because:

- Compliance requires audit of future changes
- RFP likely anticipates future features
- No additional cost for Streams over manual
- Simpler code maintenance
- Better data quality tracking

### Q2: Can we change to Streams later if needed?

**A**: Yes, but there would be:

- Downtime to migrate
- Loss of historical changelog for non-stream period
- Better to implement now, avoid retrofit

### Q3: How long is audit trail kept?

**A**: Configurable retention:

- MVP: 2 years (recommended)
- Legal holds: Permanent
- Compliance: 7+ years (per regulations)
- Cost: Minimal (old entries archived to S3)

### Q4: Can global users see all organizations?

**A**: Yes, by design:

- Global role bypasses organization filters
- See all 2,000 items + all 200,000 materials
- Audit reports across all organizations
- Compliance oversight capability

### Q5: What's the performance impact?

**A**: None visible to users:

- Changelog processing is asynchronous
- File uploads return immediately
- No latency added to any operation
- Queries optimized for 72 org filtering

---

## Conclusion

The recommended DynamoDB Streams architecture provides:

✅ **Compliance excellence** - Audit trail of all changes
✅ **Enterprise scalability** - 2,000 → 200,000+ items
✅ **Cost efficiency** - $150-1,000/year (not thousands)
✅ **Future flexibility** - Works for uploads today, APIs tomorrow
✅ **Multi-organization support** - Native 72-org isolation
✅ **Data integrity** - Immutable, tamper-proof logs

This is the ideal foundation for a compliant, scalable repair management system serving 72 organizations globally.

---

**Document Version**: 1.0  
**Date**: June 17, 2026  
**Prepared for**: Client RFP Review & Technical Committee
