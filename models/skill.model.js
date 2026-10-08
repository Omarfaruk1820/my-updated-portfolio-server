import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const getSkillsCollection = () => {
  const db = getDB();

  return db.collection("skills");
};

// Get all active skills
export const getAllSkills = async () => {
  return await getSkillsCollection()
    .find({ isActive: true })
    .sort({
      category: 1,
      order: 1,
      createdAt: -1,
    })
    .toArray();
};

// Get single skill by ID
export const getSkillById = async (id) => {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return await getSkillsCollection().findOne({
    _id: new ObjectId(id),
  });
};

// Create new skill
export const createSkill = async (skillData) => {
  const level = Number(skillData.level);

  const skill = {
    name: skillData.name?.trim(),
    category: skillData.category?.trim().toLowerCase(),
    description: skillData.description?.trim() || "",

    level: Number.isFinite(level) ? Math.min(Math.max(level, 0), 100) : 0,

    experience: skillData.experience?.trim() || "",

    focus: Array.isArray(skillData.focus)
      ? skillData.focus.map((item) => String(item).trim()).filter(Boolean)
      : [],

    order: Number(skillData.order) || 0,

    isActive: skillData.isActive !== false,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!skill.name) {
    throw new Error("Skill name is required.");
  }

  if (!skill.category) {
    throw new Error("Skill category is required.");
  }

  const result = await getSkillsCollection().insertOne(skill);

  return {
    _id: result.insertedId,
    ...skill,
  };
};

// Update skill
export const updateSkill = async (id, skillData) => {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const updateData = {
    updatedAt: new Date(),
  };

  if (skillData.name !== undefined) {
    updateData.name = String(skillData.name).trim();
  }

  if (skillData.category !== undefined) {
    updateData.category = String(skillData.category).trim().toLowerCase();
  }

  if (skillData.description !== undefined) {
    updateData.description = String(skillData.description).trim();
  }

  if (skillData.level !== undefined) {
    const level = Number(skillData.level);

    updateData.level = Number.isFinite(level)
      ? Math.min(Math.max(level, 0), 100)
      : 0;
  }

  if (skillData.experience !== undefined) {
    updateData.experience = String(skillData.experience).trim();
  }

  if (skillData.focus !== undefined) {
    updateData.focus = Array.isArray(skillData.focus)
      ? skillData.focus.map((item) => String(item).trim()).filter(Boolean)
      : [];
  }

  if (skillData.order !== undefined) {
    updateData.order = Number(skillData.order) || 0;
  }

  if (skillData.isActive !== undefined) {
    updateData.isActive = Boolean(skillData.isActive);
  }

  return await getSkillsCollection().findOneAndUpdate(
    {
      _id: new ObjectId(id),
    },
    {
      $set: updateData,
    },
    {
      returnDocument: "after",
    },
  );
};

// Delete skill
export const deleteSkill = async (id) => {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return await getSkillsCollection().findOneAndDelete({
    _id: new ObjectId(id),
  });
};
