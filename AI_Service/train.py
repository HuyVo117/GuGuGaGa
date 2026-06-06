import os
import time
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

CLASSES = [
    "Banh beo",
    "Banh bot loc",
    "Banh can",
    "Banh canh",
    "Banh chung",
    "Banh cuon",
    "Banh duc",
    "Banh gio",
    "Banh khot",
    "Banh mi",
    "Banh pia",
    "Banh tet",
    "Banh trang nuong",
    "Banh xeo",
    "Bun bo Hue",
    "Bun dau mam tom",
    "Bun mam",
    "Bun rieu",
    "Bun thit nuong",
    "Ca kho to",
    "Canh chua",
    "Cao lau",
    "Chao long",
    "Com tam",
    "Goi cuon",
    "Hu tieu",
    "Mi quang",
    "Nem chua",
    "Pho",
    "Xoi xeo",
]

class EarlyStopping:
    def __init__(self, patience=5, min_delta=0.0):
        self.patience = patience
        self.min_delta = min_delta
        self.best_loss = None
        self.counter = 0
        self.early_stop = False

    def __call__(self, val_loss):
        if self.best_loss is None:
            self.best_loss = val_loss
        elif self.best_loss - val_loss > self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
        else:
            self.counter += 1
            print(f"EarlyStopping counter: {self.counter} out of {self.patience}")
            if self.counter >= self.patience:
                self.early_stop = True

def train_model(data_dir, num_epochs=20, batch_size=16, lr=0.001, patience=5):
    # Setup directories
    os.makedirs("models", exist_ok=True)
    
    # Enable GPU if available
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training on device: {device}")

    # Data transformation and augmentation
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(20),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
            transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    # Load datasets
    image_datasets = {x: datasets.ImageFolder(os.path.join(data_dir, x), data_transforms[x])
                      for x in ['train', 'val']}
    
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=batch_size, shuffle=True, num_workers=0)
                   for x in ['train', 'val']}
    
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'val']}
    class_names = image_datasets['train'].classes
    num_classes = len(class_names)
    
    print(f"[*] Number of classes: {num_classes}")
    print(f"[*] Classes: {class_names}")
    print(f"[*] Dataset sizes: Train={dataset_sizes['train']}, Val={dataset_sizes['val']}")

    # Setup MobileNetV2 with Transfer Learning
    print("[*] Loading Pre-trained MobileNetV2...")
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    
    # Freeze early feature layers, unfreeze later ones for fine-tuning
    # MobileNetV2 has 19 feature blocks (0-18)
    # Freeze blocks 0-13, unfreeze blocks 14-18 + classifier
    for i, child in enumerate(model.features):
        if i < 14:
            for param in child.parameters():
                param.requires_grad = False
        else:
            for param in child.parameters():
                param.requires_grad = True
        
    # Replace final classifier layer
    num_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_features, num_classes),
    )
    model = model.to(device)

    best_acc = 0.0
    # Load existing model weights if exists to resume training
    model_weights_path = os.path.join("models", "food_classifier.pth")
    if os.path.exists(model_weights_path):
        print(f"[*] Found existing model weights at '{model_weights_path}'. Loading weights to resume training...")
        try:
            model.load_state_dict(torch.load(model_weights_path, map_location=device))
            print("[+] Successfully loaded weights. Resuming training...")
            best_acc = 0.7205
        except Exception as e:
            print(f"[!] Error loading weights: {e}. Starting training from scratch.")

    # Count trainable parameters
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"[*] Trainable parameters: {trainable_params:,} / {total_params:,} ({100*trainable_params/total_params:.1f}%)")

    # Loss and Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)
    
    # Learning rate scheduler — reduce on plateau
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    # Initialize early stopping
    early_stopping = EarlyStopping(patience=patience)

    since = time.time()

    for epoch in range(num_epochs):
        print(f"\n--- Epoch {epoch + 1}/{num_epochs} ---")
        
        # Each epoch has a training and validation phase
        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f"{phase.capitalize()} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

            if phase == 'val':
                scheduler.step(epoch_loss)
                early_stopping(epoch_loss)
                if epoch_acc > best_acc:
                    best_acc = epoch_acc
                    torch.save(model.state_dict(), "models/food_classifier.pth")
                    print(f"[+] Saved best model with accuracy: {best_acc:.4f}")

        if early_stopping.early_stop:
            print("[!] Early stopping triggered. Training stopped.")
            break

    time_elapsed = time.time() - since
    print(f"\n[+] Training complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s")
    print(f"[+] Best Val Accuracy: {best_acc:.4f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Vietnamese Food Classifier using Transfer Learning")
    parser.add_argument("--data_dir", type=str, default="dataset", help="Path to dataset directory")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--patience", type=int, default=5, help="Early stopping patience")
    
    args = parser.parse_args()
    train_model(
        data_dir=args.data_dir,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        patience=args.patience
    )
