import seed from "@/lib/seed";
import React from "react";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appwriteConfig, databases } from "../../lib/appwrite";

export default function Search() {
  const debugConnection = () => {
    console.log('=== Environment Variables Debug ===');
    console.log('ENDPOINT:', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
    console.log('PROJECT_ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
    console.log('DATABASE_ID:', process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);
    console.log('PLATFORM:', process.env.EXPO_PUBLIC_APPWRITE_PLATFORM);
    console.log('===================================');
  };

  const testConnection = async () => {
    try {
      console.log('Testing Appwrite connection...');
      console.log('Database ID:', appwriteConfig.databaseId);
      
      // Try to list documents from one of the collections to test connectivity
      const result = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.categoriesCollectionId!
      );
      console.log('Connection successful! Categories collection accessible:', result.total);
      
    } catch (error) {
      console.log('Connection test failed:', error);
      if (error instanceof Error) {
        console.log('Error message:', error.message);
        console.log('Error name:', error.name);
      }
    }
  };

  const testSeedWithoutImages = async () => {
    try {
      console.log('Testing seed without image uploads...');
      
      // Import the necessary components directly
      const { databases, appwriteConfig } = await import("../../lib/appwrite");
      const { ID } = await import("react-native-appwrite");
      const dummyData = await import("../../lib/data");
      
      // Test creating just categories first
      console.log('Creating categories...');
      for (const cat of dummyData.default.categories.slice(0, 2)) { // Just test 2 categories
        const doc = await databases.createDocument(
          appwriteConfig.databaseId!,
          appwriteConfig.categoriesCollectionId!,
          ID.unique(),
          cat
        );
        console.log('Created category:', doc.name);
      }
      
      console.log('Seed test completed successfully!');
    } catch (error) {
      console.log('Seed test failed:', error);
      if (error instanceof Error) {
        console.log('Error message:', error.message);
      }
    }
  };

  const testSeed = async () => {
    try {
      console.log('Starting seed process...');
      await seed();
      console.log('Seed completed successfully!');
    } catch (error) {
      console.log('Failed to seed the database.', error);
      // Log more detailed error information
      if (error instanceof Error) {
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
      }
    }
  };

  return (
    <SafeAreaView>
      <Text>Search</Text>
      <Button
        title="Debug Env"
        onPress={debugConnection}
      />
      <Button
        title="Test Connection"
        onPress={testConnection}
      />
      <Button
        title="Test Seed (No Images)"
        onPress={testSeedWithoutImages}
      />
      <Button
        title="Seed"
        onPress={testSeed}
      />
    </SafeAreaView>
  );
}
