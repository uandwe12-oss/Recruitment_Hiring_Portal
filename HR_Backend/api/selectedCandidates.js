const express = require("express");
const router = express.Router();

// Import the shared driver helper
const getDriver = require("../lib/neo4j");

// Helper function to parse skills
const parseKeySkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return skills.split(',').map(s => s.trim()).filter(s => s);
    }
  }
  return [];
};

// Helper function to format candidate for response
const formatCandidate = (candidate) => {
  const properties = candidate.properties || candidate;
  
  const canId = properties.Can_ID || properties.canId || properties.id;
  
  return {
    id: canId ? Number(canId) : null,
    actualId: canId ? Number(canId) : null,
    canId: canId ? Number(canId) : null,
    name: properties.name || properties['Candidate Name'] || '',
    email: properties.email || properties['Email'] || '',
    mobile: properties.mobile || properties['Mobile No'] || '',
    experience: properties.experience || properties['Experience'] || '',
    currentOrg: properties.currentOrg || properties['Current Org'] || '',
    currentCTC: properties.currentCTC || properties['Current CTC'] || '',
    expectedCTC: properties.expectedCTC || properties['Expected CTC'] || '',
    noticePeriod: properties.noticePeriod || properties['Notice Period in days'] || '',
    profileSourcedBy: properties.profileSourcedBy || properties['Profiles sourced by'] || '',
    clientName: properties.clientName || properties['Client Name'] || '',
    profileSubmissionDate: properties.profileSubmissionDate || properties['Profile submission date'] || '',
    visaType: properties.visaType || properties['Visa type'] || 'NA',
    resumePath: properties.resumePath || '',
    googleDriveViewLink: properties.googleDriveViewLink || '',
    keySkills: parseKeySkills(properties.keySkills || properties['Key Skills']),
    selectedAt: properties.selectedAt || new Date().toISOString(),
    status: properties.status || 'In Progress'
  };
};

/**
 * POST /api/selected-candidates/:demandId
 * Save selected candidates for a demand
 */
router.post("/:demandId", async (req, res) => {
  const { demandId } = req.params;
  const { candidates, selectedBy } = req.body;
  
  console.log(`\n📡 POST /api/selected-candidates/${demandId} - Saving candidates`);
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  if (!demandId) {
    return res.status(400).json({ success: false, message: "Demand ID is required" });
  }
  
  let candidatesArray = candidates;
  if (!Array.isArray(candidates)) {
    candidatesArray = [candidates];
  }
  
  if (!candidatesArray || candidatesArray.length === 0) {
    return res.status(400).json({ success: false, message: "Candidates are required" });
  }
  
  let driver;
  try {
    driver = getDriver();
    const session = driver.session();
    
    for (const candidate of candidatesArray) {
      const canId = candidate.canId || candidate.actualId || candidate.id;
      
      if (!canId) {
        console.warn("Candidate missing ID:", candidate);
        continue;
      }
      
      console.log(`Processing candidate with canId: ${canId}, name: ${candidate.name}`);
      
      const demandCheck = await session.run(
        "MATCH (d:Demand {id: $demandId}) RETURN d",
        { demandId: parseInt(demandId) }
      );
      
      if (demandCheck.records.length === 0) {
        console.error(`Demand with ID ${demandId} not found`);
        await session.close();
        return res.status(404).json({ 
          success: false, 
          message: `Demand with ID ${demandId} not found` 
        });
      }
      
      await session.run(`
        MATCH (d:Demand {id: $demandId})
        MERGE (sc:SelectedCandidate {canId: $canId})
        ON CREATE SET 
          sc.name = $name,
          sc.email = $email,
          sc.mobile = $mobile,
          sc.experience = $experience,
          sc.currentOrg = $currentOrg,
          sc.currentCTC = $currentCTC,
          sc.expectedCTC = $expectedCTC,
          sc.noticePeriod = $noticePeriod,
          sc.profileSourcedBy = $profileSourcedBy,
          sc.clientName = $clientName,
          sc.profileSubmissionDate = $profileSubmissionDate,
          sc.visaType = $visaType,
          sc.resumePath = $resumePath,
          sc.googleDriveViewLink = $googleDriveViewLink,
          sc.keySkills = $keySkills,
          sc.selectedAt = $selectedAt,
          sc.selectedBy = $selectedBy,
          sc.status = $status
        ON MATCH SET
          sc.selectedAt = $selectedAt,
          sc.status = $status
        MERGE (d)-[:HAS_SELECTED_CANDIDATE]->(sc)
      `, {
        demandId: parseInt(demandId),
        canId: Number(canId),
        name: candidate.name || '',
        email: candidate.email || '',
        mobile: candidate.mobile || '',
        experience: candidate.experience || '',
        currentOrg: candidate.currentOrg || '',
        currentCTC: candidate.currentCTC || '',
        expectedCTC: candidate.expectedCTC || '',
        noticePeriod: candidate.noticePeriod || '',
        profileSourcedBy: candidate.profileSourcedBy || '',
        clientName: candidate.clientName || '',
        profileSubmissionDate: candidate.profileSubmissionDate || '',
        visaType: candidate.visaType || 'NA',
        resumePath: candidate.resumePath || '',
        googleDriveViewLink: candidate.googleDriveViewLink || '',
        keySkills: JSON.stringify(candidate.keySkills || []),
        selectedAt: candidate.selectedAt || new Date().toISOString(),
        selectedBy: selectedBy || 'Unknown',
        status: candidate.status || 'In Progress'
      });
    }
    
    const countResult = await session.run(`
      MATCH (d:Demand {id: $demandId})-[:HAS_SELECTED_CANDIDATE]->(sc:SelectedCandidate)
      RETURN count(sc) as count
    `, { demandId: parseInt(demandId) });
    
    const countValue = countResult.records[0].get('count');
    let count;
    
    if (countValue && typeof countValue === 'object' && countValue.low !== undefined) {
      count = countValue.toNumber ? countValue.toNumber() : countValue.low;
    } else {
      count = Number(countValue);
    }
    
    await session.close();
    
    console.log(`✅ Successfully saved candidates for demand ${demandId}, total: ${count}`);
    
    res.json({
      success: true,
      message: `Successfully saved candidates for demand ${demandId}`,
      count: count
    });
    
  } catch (err) {
    console.error("❌ Error saving selected candidates:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({
      success: false,
      message: "Failed to save selected candidates",
      error: err.message,
      details: err.stack
    });
  }
});

/**
 * GET /api/selected-candidates/:demandId
 * Get selected candidates for a demand
 */
router.get("/:demandId", async (req, res) => {
  const { demandId } = req.params;
  
  console.log(`\n📡 GET /api/selected-candidates/${demandId} - Fetching selected candidates`);
  
  if (!demandId) {
    return res.status(400).json({ success: false, message: "Demand ID is required" });
  }
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(`
      MATCH (d:Demand {id: $demandId})-[:HAS_SELECTED_CANDIDATE]->(sc:SelectedCandidate)
      RETURN sc
      ORDER BY sc.selectedAt DESC
    `, { demandId: parseInt(demandId) });
    
    const candidates = result.records.map(record => {
      const candidate = record.get('sc').properties;
      
      const formatValue = (val) => {
        if (val && typeof val === 'object' && val.low !== undefined) {
          return val.toNumber ? val.toNumber() : val.low;
        }
        return val;
      };
      
      return {
        id: formatValue(candidate.canId),
        actualId: formatValue(candidate.canId),
        canId: formatValue(candidate.canId),
        name: candidate.name || '',
        email: candidate.email || '',
        mobile: candidate.mobile || '',
        experience: candidate.experience || '',
        currentOrg: candidate.currentOrg || '',
        currentCTC: candidate.currentCTC || '',
        expectedCTC: candidate.expectedCTC || '',
        noticePeriod: candidate.noticePeriod || '',
        profileSourcedBy: candidate.profileSourcedBy || '',
        clientName: candidate.clientName || '',
        profileSubmissionDate: candidate.profileSubmissionDate || '',
        visaType: candidate.visaType || 'NA',
        resumePath: candidate.resumePath || '',
        googleDriveViewLink: candidate.googleDriveViewLink || '',
        keySkills: parseKeySkills(candidate.keySkills),
        selectedAt: candidate.selectedAt,
        selectedBy: candidate.selectedBy,
        status: candidate.status
      };
    });
    
    console.log(`✅ Found ${candidates.length} selected candidates for demand ${demandId}`);
    
    res.json({
      success: true,
      data: candidates,
      totalCount: candidates.length,
      demandId: demandId
    });
    
  } catch (err) {
    console.error("❌ Error fetching selected candidates:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch selected candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * PUT /api/selected-candidates/status
 * Update candidate status (Selected/Rejected)
 */
router.put("/status", async (req, res) => {
  const { candidateId, demandId, status } = req.body;
  
  console.log(`\n📡 PUT /api/selected-candidates/status - Updating candidate ${candidateId} to ${status}`);
  
  if (!candidateId || !demandId || !status) {
    return res.status(400).json({ 
      success: false, 
      message: "candidateId, demandId, and status are required" 
    });
  }
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(`
      MATCH (d:Demand {id: $demandId})-[r:HAS_SELECTED_CANDIDATE]->(sc:SelectedCandidate {canId: $candidateId})
      SET sc.status = $status,
          sc.updatedAt = $updatedAt
      RETURN sc
    `, {
      demandId: parseInt(demandId),
      candidateId: parseInt(candidateId),
      status: status,
      updatedAt: new Date().toISOString()
    });
    
    if (!result.records.length) {
      return res.status(404).json({ 
        success: false, 
        message: "Candidate not found for this demand" 
      });
    }
    
    const updatedCandidate = result.records[0].get('sc').properties;
    
    console.log(`✅ Candidate ${candidateId} status updated to ${status}`);
    
    res.json({
      success: true,
      message: `Candidate status updated to ${status}`,
      data: updatedCandidate
    });
    
  } catch (err) {
    console.error("❌ Error updating candidate status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update candidate status",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /api/selected-candidates/:demandId/:candidateId
 * Remove a specific candidate from a demand
 */
router.delete("/:demandId/:candidateId", async (req, res) => {
  const { demandId, candidateId } = req.params;
  
  console.log(`\n📡 DELETE /api/selected-candidates/${demandId}/${candidateId} - Removing candidate`);
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    await session.run(`
      MATCH (d:Demand {id: $demandId})-[r:HAS_SELECTED_CANDIDATE]->(sc:SelectedCandidate {canId: $candidateId})
      DELETE r, sc
    `, {
      demandId: parseInt(demandId),
      candidateId: parseInt(candidateId)
    });
    
    res.json({
      success: true,
      message: `Candidate removed from demand ${demandId}`
    });
    
  } catch (err) {
    console.error("❌ Error removing candidate:", err);
    res.status(500).json({
      success: false,
      message: "Failed to remove candidate",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /api/selected-candidates/:demandId
 * Delete all selected candidates for a demand
 */
router.delete("/:demandId", async (req, res) => {
  const { demandId } = req.params;
  
  console.log(`\n📡 DELETE /api/selected-candidates/${demandId} - Clearing all selected candidates`);
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    await session.run(`
      MATCH (d:Demand {id: $demandId})-[r:HAS_SELECTED_CANDIDATE]->(sc:SelectedCandidate)
      DELETE r, sc
    `, { demandId: parseInt(demandId) });
    
    res.json({
      success: true,
      message: `All selected candidates cleared for demand ${demandId}`
    });
    
  } catch (err) {
    console.error("❌ Error clearing candidates:", err);
    res.status(500).json({
      success: false,
      message: "Failed to clear candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

module.exports = router;
