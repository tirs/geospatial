# Use the official .NET 8 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 10000

# Use the .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["UrbanReferralNetwork.csproj", "."]
RUN dotnet restore "UrbanReferralNetwork.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "UrbanReferralNetwork.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "UrbanReferralNetwork.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "UrbanReferralNetwork.dll"]