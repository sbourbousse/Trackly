# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copier les fichiers de projet
COPY ["Trackly.Backend.csproj", "./"]
RUN dotnet restore "Trackly.Backend.csproj"

# Copier le reste du code
COPY . .
RUN dotnet build "Trackly.Backend.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "Trackly.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Créer un utilisateur non-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copier les fichiers publiés
COPY --from=publish /app/publish .

# Changer le propriétaire
RUN chown -R appuser:appuser /app

# Passer à l'utilisateur non-root
USER appuser

# Exposer le port (Railway utilisera la variable PORT)
EXPOSE 8080

# Commande de démarrage
ENTRYPOINT ["dotnet", "Trackly.Backend.dll"]
