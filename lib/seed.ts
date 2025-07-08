/**
 * Database Seeding Script for Restaurant/Food Delivery App
 * 
 * This module provides comprehensive database seeding functionality for a React Native
 * restaurant application using Appwrite as the backend service. It handles:
 * - Data cleanup and initialization
 * - Image migration from external URLs to Appwrite storage
 * - Creation of relational data structures (categories, menu items, customizations)
 * - Establishment of many-to-many relationships between entities
 * 
 * @author Abdelkabir
 * @version 1.0.0
 * @requires react-native-appwrite
 */

import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

/**
 * Represents a food category (e.g., Pizza, Burgers, Desserts)
 */
interface Category {
  name: string;        // Category display name
  description: string; // Category description for users
}

/**
 * Represents a customization option for menu items
 */
interface Customization {
  name: string;   // Customization name (e.g., "Extra Cheese")
  price: number;  // Additional cost for this customization
  type: "topping" | "side" | "size" | "crust" | string; // Customization category
}

/**
 * Represents a menu item with all its properties
 */
interface MenuItem {
  name: string;           // Item name
  description: string;    // Item description
  image_url: string;      // URL to item image
  price: number;          // Base price
  rating: number;         // Customer rating (0-5)
  calories: number;       // Nutritional information
  protein: number;        // Protein content in grams
  category_name: string;  // Reference to category name
  customizations: string[]; // Array of customization names available for this item
}

/**
 * Structure of the dummy data import
 */
interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

// Type assertion to ensure dummy data matches expected structure
const data = dummyData as DummyData;

/**
 * Clears all documents from a specified Appwrite collection
 * 
 * @param collectionId - The ID of the collection to clear
 * @returns Promise that resolves when all documents are deleted
 * 
 * @example
 * await clearAll(appwriteConfig.categoriesCollectionId!);
 */
async function clearAll(collectionId: string): Promise<void> {
  // Fetch all existing documents from the collection
  const list = await databases.listDocuments(
    appwriteConfig.databaseId!,
    collectionId
  );

  // Delete all documents concurrently for better performance
  await Promise.all(
    list.documents.map((doc) =>
      databases.deleteDocument(appwriteConfig.databaseId!, collectionId, doc.$id)
    )
  );
}

/**
 * Clears all files from the Appwrite storage bucket
 * 
 * @returns Promise that resolves when all files are deleted
 * 
 * @example
 * await clearStorage();
 */
async function clearStorage(): Promise<void> {
  // Get list of all files in the storage bucket
  const list = await storage.listFiles(appwriteConfig.bucketId!);

  // Delete all files concurrently
  await Promise.all(
    list.files.map((file) =>
      storage.deleteFile(appwriteConfig.bucketId!, file.$id)
    )
  );
}

/**
 * Downloads an image from an external URL and uploads it to Appwrite storage
 * 
 * This function handles:
 * - Fetching images with browser-like headers to avoid bot detection
 * - Error handling with fallback to original URL
 * - Proper file object creation for React Native Appwrite
 * 
 * @param imageUrl - The external URL of the image to upload
 * @returns Promise resolving to the new Appwrite storage URL or original URL on failure
 * 
 * @example
 * const newUrl = await uploadImageToStorage('https://example.com/image.jpg');
 */
async function uploadImageToStorage(imageUrl: string) {
  try {
    console.log('Uploading image:', imageUrl);
    
    // Fetch the image with browser-like headers to avoid blocking
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        // Mimic a real browser request
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // Check if the request was successful
    if (!response.ok) {
      console.log('Failed to fetch image, status:', response.status);
      return imageUrl; // Return original URL as fallback
    }
    
    // Convert response to blob for file upload
    const blob = await response.blob();
    console.log('Image fetched successfully, size:', blob.size);

    // Extract filename from URL, removing query parameters
    const fileName = imageUrl.split("/").pop()?.split('?')[0] || `image-${Date.now()}.png`;
    const mimeType = blob.type || 'image/png';

    // Create file object compatible with React Native Appwrite
    const fileObj = {
      name: fileName,
      type: mimeType,
      size: blob.size,
      uri: imageUrl,
    };

    console.log('Attempting to upload to Appwrite storage...');
    
    // Upload file to Appwrite storage
    const file = await storage.createFile(
      appwriteConfig.bucketId!,
      ID.unique(), // Generate unique ID for the file
      fileObj
    );

    // Get the public URL for the uploaded file
    const uploadedUrl = storage.getFileViewURL(appwriteConfig.bucketId!, file.$id);
    console.log('Image uploaded successfully to Appwrite:', file.$id);
    return uploadedUrl;
    
  } catch (error) {
    console.log('Error uploading image:', error);
    
    // Log specific Appwrite error messages if available
    if (error && typeof error === 'object' && 'message' in error) {
      console.log('Appwrite error message:', error.message);
    }
    
    console.log('Using original URL as fallback');
    return imageUrl; // Return original URL as fallback
  }
}

/**
 * Main seeding function that orchestrates the entire database population process
 * 
 * Process flow:
 * 1. Clear all existing data (collections and storage)
 * 2. Create categories and build ID mapping
 * 3. Create customizations and build ID mapping
 * 4. Create menu items with image uploads and category relationships
 * 5. Create many-to-many relationships between menu items and customizations
 * 
 * @returns Promise that resolves when seeding is complete
 * 
 * @example
 * import seed from './seed';
 * 
 * seed()
 *   .then(() => console.log('Database seeded successfully'))
 *   .catch(error => console.error('Seeding failed:', error));
 */
async function seed(): Promise<void> {
  console.log('🌱 Starting database seeding process...');
  
  // STEP 1: Clear all existing data to ensure clean slate
  console.log('🧹 Clearing existing data...');
  await clearAll(appwriteConfig.categoriesCollectionId!);
  await clearAll(appwriteConfig.customizationsCollectionId!);
  await clearAll(appwriteConfig.menuCollectionId!);
  await clearAll(appwriteConfig.menuCustomizationsCollectionId!);
  await clearStorage();
  console.log('✅ Data cleared successfully');

  // STEP 2: Create Categories
  console.log('📂 Creating categories...');
  const categoryMap: Record<string, string> = {}; // Maps category names to database IDs
  
  for (const cat of data.categories) {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.categoriesCollectionId!,
      ID.unique(),
      cat
    );
    // Store the mapping for later use in menu items
    categoryMap[cat.name] = doc.$id;
  }
  console.log(`✅ Created ${Object.keys(categoryMap).length} categories`);

  // STEP 3: Create Customizations
  console.log('🎨 Creating customizations...');
  const customizationMap: Record<string, string> = {}; // Maps customization names to database IDs
  
  for (const cus of data.customizations) {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.customizationsCollectionId!,
      ID.unique(),
      {
        name: cus.name,
        price: cus.price,
        type: cus.type,
      }
    );
    // Store the mapping for later use in menu-customization relationships
    customizationMap[cus.name] = doc.$id;
  }
  console.log(`✅ Created ${Object.keys(customizationMap).length} customizations`);

  // STEP 4: Create Menu Items
  console.log('🍽️ Creating menu items...');
  const menuMap: Record<string, string> = {}; // Maps menu item names to database IDs
  
  for (const item of data.menu) {
    console.log(`Processing menu item: ${item.name}`);
    
    // Add delay between requests to avoid API rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    
    // Upload item image to Appwrite storage
    const uploadedImage = await uploadImageToStorage(item.image_url);

    // Create menu item document
    const doc = await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.menuCollectionId!,
      ID.unique(),
      {
        name: item.name,
        description: item.description,
        image_url: uploadedImage, // Use uploaded image URL
        price: item.price,
        rating: item.rating,
        calories: item.calories,
        protein: item.protein,
        categories: categoryMap[item.category_name], // Reference to category document
      }
    );

    // Store menu item ID for relationship creation
    menuMap[item.name] = doc.$id;

    // STEP 5: Create menu_customizations relationships
    // This creates the many-to-many relationship between menu items and customizations
    for (const cusName of item.customizations) {
      await databases.createDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.menuCustomizationsCollectionId!,
        ID.unique(),
        {
          menu: doc.$id, // Reference to menu item
          customizations: customizationMap[cusName], // Reference to customization
        }
      );
    }
  }
  console.log(`✅ Created ${Object.keys(menuMap).length} menu items with relationships`);

  console.log("✅ Seeding complete! Database has been successfully populated.");
}

// Export the seed function as the default export
export default seed;